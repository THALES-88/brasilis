# Diretrizes de Arquitetura e Implementação — Buscador Semântico de Arte Brasileira

Este documento consolida o planejamento, fontes de dados, modelo de metadados, pipeline de embeddings multimodais, motor de busca híbrido, interface editorial e configuração de deploy em edge para a construção de um arquivo digital e motor de busca semântico focado exclusivamente em artistas e acervos brasileiros.

---

## 1. Conceito e Proposta de Valor

Inspirado na abordagem de descoberta semântica do *The Last Museum*, o projeto propõe um índice visual e conceitual gratuito para a produção artística brasileira — abrangendo do Barroco mineiro e Academismo oitocentista ao Modernismo, Concretismo, Neoconcretismo, arte popular, gravura, fotografia documental e arte contemporânea.

### Pilares Fundamentais
* **Busca Semântica e Atmosférica:** Permite pesquisar em português por cenas, atmosferas, luz, paleta ou conceitos livres (ex.: *"paisagem mineira melancólica ao entardecer"*, *"formas geométricas construtivas"*), sem exigir o nome exato da obra ou do autor.
* **Descoberta por Proximidade:** Navegação contínua entre obras visualmente e conceitualmente próximas por meio de similaridade vetorial e cromática.
* **Agregação Ética e Atribuição:** Funciona como camada de índice e descoberta, apontando sempre para a ficha oficial na instituição detentora e respeitando a legislação brasileira de direitos autorais (Lei 9.610/98).
* **Direção Visual Editorial Minimalista:** Tipografia grotesca limpa, paleta neutra de alto contraste (`#F7F6F2` e `#141413`), filetes de `1px`, respiro generoso e foco absoluto nas obras.

---

## 2. Mapeamento de Fontes e Acervos Brasileiros

### 2.1. Agregadores e Bases com API / Dados Estruturados (Prioridade MVP)
* **Brasiliana Museus (Ibram):** Agregador oficial do Instituto Brasileiro de Museus que conecta museus federais e parceiros com APIs públicas padronizadas.
* **Ecossistema Tainacan:** Plataforma livre brasileira (UnB/IBICT/Ibram) adotada por acervos como Museu da Inconfidência, Museu Victor Meirelles, Museu Histórico Nacional, Museu da República e Museu Regional de São João del-Rei. Expõe **API REST nativa** (`/wp-json/tainacan/v2`) com retorno em JSON.
* **Wikimedia Commons & Wikidata (GLAM Brasil):** Coleções liberadas em domínio público ou Creative Commons (com destaque para o Museu Paulista / Museu do Ipiranga e acervos do Ibram). Permite consultas estruturadas via SPARQL e normalização de artistas por identificador único (`QID`).
* **Meta-Acervos (USP / FAU):** Plataforma que interliga coleções de 17 instituições brasileiras com foco em pesquisa visual e cruzamento de acervos.

### 2.2. Museus e Instituições com Catálogos Digitais Relevantes
| Instituição | Recorte Forte | Observação |
|---|---|---|
| **MASP** | Arte brasileira moderna, acadêmica e popular | Catálogo online com fichas técnicas detalhadas. |
| **Pinacoteca de São Paulo** | Século XIX até arte contemporânea | Forte presença de pintura acadêmica, modernismo e artistas negros. |
| **Museu Nacional de Belas Artes (MNBA)** | Academismo oitocentista e transição moderna | Acervo federal vinculado ao Ibram. |
| **Museus Castro Maya** | Modernismo, arte popular e gravura | Integrado às bases do Ibram e Google Arts & Culture. |
| **Museu Lasar Segall** | Modernismo, gravura, desenho e fotografia | Coleção digitalizada vinculada ao Ibram. |
| **Instituto Inhotim** | Arte contemporânea brasileira | Catálogo online com contexto curatorial. |
| **IAC (Instituto de Arte Contemporânea)** | Concretismo, Neoconcretismo e arquivos de artistas | Banco de dados online com obras e registros. |

### 2.3. Plataformas de Referência e Iconografia
* **Enciclopédia Itaú Cultural:** Referência textual e visual sobre artistas, movimentos e exposições brasileiras (útil para enriquecimento contextual e linkagem).
* **Brasiliana Iconográfica:** Gravuras, aquarelas e desenhos sobre o Brasil do período colonial ao início do século XX.
* **Projeto FHAB / ArteData:** Documentação especializada em pintura brasileira entre 1790 e 1940.

---

## 3. Schema JSON de Metadados Normalizados (`artwork.schema.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ObraArteBrasil",
  "type": "object",
  "required": ["id", "title", "artist", "source", "rights", "media"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Hash determinístico baseado na instituição, ID de origem e título normalizado"
    },
    "wikidata_qid": {
      "type": ["string", "null"],
      "pattern": "^Q[0-9]+$"
    },
    "title": { "type": "string" },
    "alternative_titles": {
      "type": "array",
      "items": { "type": "string" }
    },
    "artist": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "wikidata_qid": { "type": ["string", "null"] },
        "name": { "type": "string" },
        "birth_year": { "type": ["integer", "null"] },
        "death_year": { "type": ["integer", "null"] },
        "origin_state": { "type": ["string", "null"] },
        "gender_or_identity": { "type": ["string", "null"] }
      }
    },
    "chronology": {
      "type": "object",
      "properties": {
        "display_date": { "type": "string" },
        "year_start": { "type": ["integer", "null"] },
        "year_end": { "type": ["integer", "null"] },
        "decade": { "type": ["integer", "null"] }
      }
    },
    "classification": {
      "type": "object",
      "properties": {
        "medium": { "type": "string" },
        "category": {
          "type": "string",
          "enum": ["pintura", "escultura", "gravura", "desenho", "fotografia", "instalacao", "arte_popular", "outro"]
        },
        "movements": {
          "type": "array",
          "items": { "type": "string" }
        },
        "dimensions_cm": {
          "type": "object",
          "properties": {
            "height": { "type": ["number", "null"] },
            "width": { "type": ["number", "null"] },
            "depth": { "type": ["number", "null"] }
          }
        }
      }
    },
    "source": {
      "type": "object",
      "required": ["institution", "record_url", "provider"],
      "properties": {
        "provider": { "type": "string", "enum": ["tainacan", "wikidata", "brasiliana", "institutional_api"] },
        "institution": { "type": "string" },
        "institution_city": { "type": ["string", "null"] },
        "inventory_code": { "type": ["string", "null"] },
        "record_url": { "type": "string", "format": "uri" }
      }
    },
    "rights": {
      "type": "object",
      "required": ["status"],
      "properties": {
        "status": {
          "type": "string",
          "enum": ["public_domain", "cc_open", "copyright_restricted", "unknown"]
        },
        "license_code": { "type": ["string", "null"] },
        "allow_full_display": { "type": "boolean" }
      }
    },
    "media": {
      "type": "object",
      "required": ["thumb_url"],
      "properties": {
        "thumb_url": { "type": "string", "format": "uri" },
        "full_url": { "type": ["string", "null"], "format": "uri" },
        "aspect_ratio": { "type": "number" },
        "dominant_colors": {
          "type": "array",
          "items": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" }
        }
      }
    },
    "semantic": {
      "type": "object",
      "properties": {
        "visual_caption_pt": { "type": "string" },
        "tags_pt": { "type": "array", "items": { "type": "string" } },
        "mood": { "type": "array", "items": { "type": "string" } },
        "embedding_model": { "type": "string" },
        "embedding_id": { "type": "string" },
        "vector_index": { "type": "integer" }
      }
    }
  }
}
```

---

## 4. Pipeline de Ingestão e Enriquecimento Semântico (Bun / TypeScript)

### 4.1. Arquitetura do Pipeline em 5 Etapas
1. **Ingestão Determinística:** Coleta via API REST do Tainacan utilizando `fetch_only=id,title,url,thumbnail,metadata`, extração de datas históricas para cálculo de décadas e verificação automática de domínio público.
2. **Enriquecimento Visual via VLM:** Análise de cada miniatura via `gemini-2.5-flash` com *Structured Outputs* para gerar descrição visual curatorial em português (45–75 palavras), tags temáticas, adjetivos de atmosfera (`mood`) e 4 cores dominantes em hexadecimal (`#RRGGBB`).
3. **Documento Semântico Composto:** Consolidação de título, artista, data, técnica, movimento, descrição visual e atmosfera em um bloco padronizado.
4. **Vetorização Assimétrica e Normalização L2:** Geração de vetores de 768 dimensões com `text-embedding-004` (`taskType: "RETRIEVAL_DOCUMENT"` para obras e `"RETRIEVAL_QUERY"` para consultas) normalizados em L2 para que o produto escalar equivalha à similaridade de cosseno.
5. **Empacotamento Binário (`embeddings.f32`):** Armazenamento contíguo em `Float32Array`, eliminando overhead de parsing JSON e permitindo busca client-side/edge em menos de 2 ms.

### 4.2. Script de Ingestão Tainacan (`ingest-tainacan.ts`)

```typescript
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const SOURCE_CONFIG = {
  baseUrl: "https://museudainconfidencia.acervos.cultura.gov.br/wp-json/tainacan/v2",
  collectionId: 28,
  institution: "Museu da Inconfidência",
  institutionCity: "Ouro Preto, MG",
  perPage: 50,
  maxPages: 3,
};

function generateDeterministicId(institution: string, sourceId: number | string, title: string): string {
  return createHash("sha256")
    .update(`${institution.toLowerCase()}::${sourceId}::${title.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);
}

function extractMeta(metadata: Record<string, any>, keywords: string[]): string | null {
  if (!metadata) return null;
  for (const [key, field] of Object.entries(metadata)) {
    const label = `${key} ${field?.name ?? ""}`.toLowerCase();
    if (keywords.some((kw) => label.includes(kw))) {
      const val = field?.value_as_string ?? field?.value;
      if (Array.isArray(val)) return val.map(String).join(", ").trim() || null;
      if (typeof val === "string" && val.trim()) return val.replace(/<[^>]*>/g, "").trim();
      if (typeof val === "number") return String(val);
    }
  }
  return null;
}

function parseChronology(rawDate: string | null) {
  if (!rawDate) return { display_date: "Data desconhecida", year_start: null, year_end: null, decade: null };
  const yearMatch = rawDate.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return { display_date: rawDate, year_start: year, year_end: year, decade: Math.floor(year / 10) * 10 };
  }
  const centuryMap: Record<string, number> = { xvi: 1501, xvii: 1601, xviii: 1701, xix: 1801, xx: 1901, xxi: 2001 };
  const centuryMatch = rawDate.toLowerCase().match(/s[eé]c(?:ulo)?\.?\s*(x{1,2}i{0,3}|xvi{1,3})/i);
  if (centuryMatch) {
    const start = centuryMap[centuryMatch[1].toLowerCase()] ?? null;
    return {
      display_date: rawDate,
      year_start: start,
      year_end: start ? start + 99 : null,
      decade: start ? Math.floor(start / 10) * 10 : null,
    };
  }
  return { display_date: rawDate, year_start: null, year_end: null, decade: null };
}

function inferCategory(rawCategory: string | null, rawMedium: string | null) {
  const combined = `${rawCategory ?? ""} ${rawMedium ?? ""}`.toLowerCase();
  if (combined.includes("pintura") || combined.includes("óleo") || combined.includes("têmpera") || combined.includes("acrílica")) return "pintura";
  if (combined.includes("escultura") || combined.includes("entalhe") || combined.includes("imaginária") || combined.includes("bronze")) return "escultura";
  if (combined.includes("gravura") || combined.includes("xilogravura") || combined.includes("litografia") || combined.includes("água-forte")) return "gravura";
  if (combined.includes("desenho") || combined.includes("aquarela") || combined.includes("nanquim") || combined.includes("grafite")) return "desenho";
  if (combined.includes("fotografia") || combined.includes("daguerreótipo") || combined.includes("gelatina")) return "fotografia";
  if (combined.includes("instalação") || combined.includes("objeto")) return "instalacao";
  if (combined.includes("popular") || combined.includes("ex-voto") || combined.includes("cerâmica")) return "arte_popular";
  return "outro";
}

function parseDimensions(rawDim: string | null) {
  if (!rawDim) return { height: null, width: null, depth: null };
  const nums = rawDim.replace(/,/g, ".").match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (!nums || nums.length === 0) return { height: null, width: null, depth: null };
  return { height: nums[0] ?? null, width: nums[1] ?? null, depth: nums[2] ?? null };
}

function inferRights(yearEnd: number | null, licenseRaw: string | null) {
  const currentYear = new Date().getFullYear();
  const isHistoricPublicDomain = yearEnd !== null && currentYear - yearEnd > 110;
  if (isHistoricPublicDomain || (licenseRaw && /cc0|dom[ií]nio p[uú]blico|public domain/i.test(licenseRaw))) {
    return { status: "public_domain" as const, license_code: "PD", allow_full_display: true };
  }
  if (licenseRaw && /cc-by/i.test(licenseRaw)) {
    return { status: "cc_open" as const, license_code: licenseRaw.toUpperCase(), allow_full_display: true };
  }
  return { status: "unknown" as const, license_code: licenseRaw, allow_full_display: false };
}

function normalizeTainacanItem(item: any) {
  const thumbUrl: string | undefined =
    item?.thumbnail?.["tainacan-medium-full"]?.[0] ??
    item?.thumbnail?.medium_large?.[0] ??
    item?.thumbnail?.full?.[0];
  if (!thumbUrl) return null;

  const fullUrl: string | null = item?.thumbnail?.full?.[0] ?? null;
  const width = Number(item?.thumbnail?.full?.[1]) || 800;
  const height = Number(item?.thumbnail?.full?.[2]) || 800;
  const meta = item?.metadata ?? {};

  const title = (item?.title ?? "Sem título").trim();
  const rawArtist = extractMeta(meta, ["autor", "artista", "autoria", "criador"]) ?? "Autoria desconhecida";
  const rawDate = extractMeta(meta, ["data", "época", "período", "ano", "datação"]);
  const rawMedium = extractMeta(meta, ["técnica", "material", "suporte", "meio"]) ?? "Técnica não especificada";
  const rawCategory = extractMeta(meta, ["classe", "categoria", "tipologia", "objeto"]);
  const rawDimensions = extractMeta(meta, ["dimens", "medida", "altura"]);
  const inventoryCode = extractMeta(meta, ["tombo", "registro", "inventário", "código"]);
  const licenseRaw = extractMeta(meta, ["direitos", "licença", "cessão"]);

  const chronology = parseChronology(rawDate);
  const rights = inferRights(chronology.year_end, licenseRaw);
  const id = generateDeterministicId(SOURCE_CONFIG.institution, item.id, title);

  return {
    id,
    wikidata_qid: null,
    title,
    alternative_titles: [],
    artist: {
      wikidata_qid: null,
      name: rawArtist,
      birth_year: null,
      death_year: null,
      origin_state: null,
      gender_or_identity: null,
    },
    chronology,
    classification: {
      medium: rawMedium,
      category: inferCategory(rawCategory, rawMedium),
      movements: [],
      dimensions_cm: parseDimensions(rawDimensions),
    },
    source: {
      provider: "tainacan" as const,
      institution: SOURCE_CONFIG.institution,
      institution_city: SOURCE_CONFIG.institutionCity,
      inventory_code: inventoryCode,
      record_url: item.url,
    },
    rights,
    media: {
      thumb_url: thumbUrl,
      full_url: rights.allow_full_display ? fullUrl : null,
      aspect_ratio: Number((width / height).toFixed(3)),
      dominant_colors: [],
    },
    semantic: {
      visual_caption_pt: "",
      tags_pt: [],
      mood: [],
      embedding_model: "",
      embedding_id: id,
    },
  };
}

async function runIngestion() {
  const results = [];
  for (let page = 1; page <= SOURCE_CONFIG.maxPages; page++) {
    const endpoint = `${SOURCE_CONFIG.baseUrl}/collection/${SOURCE_CONFIG.collectionId}/items?perpage=${SOURCE_CONFIG.perPage}&paged=${page}&fetch_only=id,title,url,thumbnail,metadata`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "AcervoArteBrasil-Indexer/1.0" },
    });
    if (!response.ok) break;
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (items.length === 0) break;
    for (const rawItem of items) {
      const normalized = normalizeTainacanItem(rawItem);
      if (normalized) results.push(normalized);
    }
  }
  await mkdir("./data", { recursive: true });
  await writeFile("./data/obras-normalizadas.json", JSON.stringify(results, null, 2), "utf-8");
  console.log(`Concluído: ${results.length} obras normalizadas.`);
}

runIngestion();
```

### 4.3. Script de Enriquecimento VLM e Vetorização (`enrich-semantic.ts`)

```typescript
import { readFile, writeFile } from "node:fs/promises";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const CONFIG = {
  inputPath: "./data/obras-normalizadas.json",
  outputJsonPath: "./data/obras-enriquecidas.json",
  outputVectorsPath: "./data/embeddings.f32",
  vlmModel: "gemini-2.5-flash",
  embeddingModel: "text-embedding-004",
  embeddingDimensions: 768,
  concurrency: 3,
  saveEvery: 10,
};

async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AcervoArteBrasil-Enricher/1.0" } });
    if (!res.ok) return null;
    const mimeType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return { mimeType, data: base64 };
  } catch {
    return null;
  }
}

async function analyzeArtworkVisuals(artwork: any) {
  const image = await fetchImageAsBase64(artwork.media.thumb_url);
  if (!image) return null;

  const prompt = `Você é um historiador da arte e curador especializado em arte brasileira.
Analise a imagem desta obra e seus metadados básicos:
- Título: ${artwork.title}
- Artista: ${artwork.artist.name}
- Datação: ${artwork.chronology.display_date}
- Técnica: ${artwork.classification.medium}
- Instituição: ${artwork.source.institution}

Gere uma análise visual densa e precisa em português do Brasil para indexação semântica:
1. visual_caption_pt: parágrafo objetivo e descritivo (45 a 75 palavras) detalhando o sujeito principal, composição, luz/contraste, pincelada ou textura, paisagem/elementos culturais brasileiros (se presentes) e atmosfera.
2. tags_pt: 5 a 8 descritores curtos em português.
3. mood: 3 a 4 adjetivos que definam a atmosfera visual e emocional.
4. dominant_colors: 4 códigos hexadecimais (#RRGGBB) representando as cores predominantes reais da imagem.
5. suggested_movements: até 2 movimentos ou estilos artísticos coerentes com a obra no contexto brasileiro.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.vlmModel}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.data } }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["visual_caption_pt", "tags_pt", "mood", "dominant_colors", "suggested_movements"],
          properties: {
            visual_caption_pt: { type: "STRING" },
            tags_pt: { type: "ARRAY", items: { type: "STRING" } },
            mood: { type: "ARRAY", items: { type: "STRING" } },
            dominant_colors: { type: "ARRAY", items: { type: "STRING" } },
            suggested_movements: { type: "ARRAY", items: { type: "STRING" } },
          },
        },
      },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return rawJson ? JSON.parse(rawJson) : null;
}

async function generateSemanticEmbedding(artwork: any): Promise<number[] | null> {
  const movements = artwork.classification.movements?.join(", ") || "Não especificado";
  const compositeDocument = [
    `Obra: ${artwork.title} | Artista: ${artwork.artist.name} (${artwork.chronology.display_date})`,
    `Técnica e Categoria: ${artwork.classification.medium} (${artwork.classification.category})`,
    `Movimento ou Estilo: ${movements}`,
    `Descrição Visual: ${artwork.semantic.visual_caption_pt}`,
    `Atmosfera e Temas: ${(artwork.semantic.mood || []).join(", ")}. ${(artwork.semantic.tags_pt || []).join(", ")}`,
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.embeddingModel}:embedContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${CONFIG.embeddingModel}`,
      content: { parts: [{ text: compositeDocument }] },
      taskType: "RETRIEVAL_DOCUMENT",
      title: artwork.title,
      outputDimensionality: CONFIG.embeddingDimensions,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.embedding?.values ?? null;
}

function l2Normalize(vec: number[]): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

async function runEnrichment() {
  const artworks: any[] = JSON.parse(await readFile(CONFIG.inputPath, "utf-8"));
  const existingMap = new Map<string, any>();
  try {
    const prev = JSON.parse(await readFile(CONFIG.outputJsonPath, "utf-8"));
    for (const item of prev) existingMap.set(item.id, item);
  } catch {}

  const enrichedList: any[] = [];
  const vectorMap = new Map<string, Float32Array>();

  for (let i = 0; i < artworks.length; i += CONFIG.concurrency) {
    const batch = artworks.slice(i, i + CONFIG.concurrency);
    await Promise.all(
      batch.map(async (art) => {
        const cached = existingMap.get(art.id);
        if (cached?.semantic?.visual_caption_pt && cached?.semantic?.vector) {
          vectorMap.set(art.id, l2Normalize(cached.semantic.vector));
          const { vector, ...cleanSemantic } = cached.semantic;
          enrichedList.push({ ...cached, semantic: cleanSemantic });
          return;
        }

        const analysis = await analyzeArtworkVisuals(art);
        if (!analysis) {
          enrichedList.push(art);
          return;
        }

        art.media.dominant_colors = analysis.dominant_colors.slice(0, 4);
        if (art.classification.movements.length === 0 && analysis.suggested_movements.length > 0) {
          art.classification.movements = analysis.suggested_movements;
        }

        art.semantic = {
          visual_caption_pt: analysis.visual_caption_pt,
          tags_pt: analysis.tags_pt,
          mood: analysis.mood,
          embedding_model: CONFIG.embeddingModel,
          embedding_id: art.id,
        };

        const rawVector = await generateSemanticEmbedding(art);
        if (rawVector) {
          const normalizedVec = l2Normalize(rawVector);
          vectorMap.set(art.id, normalizedVec);
          existingMap.set(art.id, { ...art, semantic: { ...art.semantic, vector: Array.from(normalizedVec) } });
        }
        enrichedList.push(art);
      })
    );

    if ((i + CONFIG.concurrency) % CONFIG.saveEvery === 0) {
      await writeFile(CONFIG.outputJsonPath, JSON.stringify(enrichedList, null, 2), "utf-8");
    }
  }

  const indexedArtworks = enrichedList.filter((a) => vectorMap.has(a.id));
  const flatBuffer = new Float32Array(indexedArtworks.length * CONFIG.embeddingDimensions);

  indexedArtworks.forEach((art, idx) => {
    flatBuffer.set(vectorMap.get(art.id)!, idx * CONFIG.embeddingDimensions);
    art.semantic.vector_index = idx;
  });

  await writeFile(CONFIG.outputJsonPath, JSON.stringify(indexedArtworks, null, 2), "utf-8");
  await writeFile(CONFIG.outputVectorsPath, Buffer.from(flatBuffer.buffer));
}

runEnrichment();
```

---

## 5. Motor de Busca Híbrido (`src/lib/hybrid-search.ts`)

Combina **similaridade vetorial** (produto escalar sobre vetores L2-normalizados), **proximidade cromática perceptiva CIE Lab ($\Delta E$)**, **reforço lexical** e **filtros rígidos de década e tipologia**.

```typescript
export interface ArtworkRecord {
  id: string;
  title: string;
  artist: { name: string; origin_state: string | null };
  chronology: { display_date: string; year_start: number | null; year_end: number | null; decade: number | null };
  classification: { medium: string; category: string; movements: string[] };
  source: { institution: string; record_url: string };
  media: { thumb_url: string; full_url: string | null; aspect_ratio: number; dominant_colors: string[] };
  semantic: { visual_caption_pt: string; tags_pt: string[]; mood: string[]; vector_index: number };
}

export interface SearchFilters {
  queryText?: string;
  queryVector?: Float32Array;
  targetHex?: string;
  colorTolerance?: number;
  decadeRange?: [number, number];
  category?: string;
  institution?: string;
  limit?: number;
}

export interface SearchResult {
  artwork: ArtworkRecord;
  score: number;
  breakdown: { semantic: number; lexical: number; color: number };
}

type LabColor = [number, number, number];

function hexToLab(hex: string): LabColor {
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  let r = ((num >> 16) & 255) / 255;
  let g = ((num >> 8) & 255) / 255;
  let b = (num & 255) / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function deltaE(a: LabColor, b: LabColor): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function normalizeText(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export class BrazilianArtSearchEngine {
  private artworks: ArtworkRecord[];
  private vectors: Float32Array;
  private dimensions: number;
  private labCache: Map<string, LabColor[]>;
  private searchableTextCache: string[];

  constructor(artworks: ArtworkRecord[], flatVectors: Float32Array, dimensions = 768) {
    this.artworks = artworks;
    this.vectors = flatVectors;
    this.dimensions = dimensions;
    this.labCache = new Map();

    this.searchableTextCache = artworks.map((art) => {
      this.labCache.set(art.id, (art.media.dominant_colors || []).map(hexToLab));
      return normalizeText(
        [art.title, art.artist.name, art.classification.medium, art.classification.movements.join(" "), art.semantic.tags_pt.join(" ")].join(" ")
      );
    });
  }

  static async load(jsonUrl: string, f32Url: string, dimensions = 768): Promise<BrazilianArtSearchEngine> {
    const [jsonRes, binRes] = await Promise.all([fetch(jsonUrl), fetch(f32Url)]);
    if (!jsonRes.ok || !binRes.ok) throw new Error("Falha ao carregar índices do acervo.");
    const artworks: ArtworkRecord[] = await jsonRes.json();
    const flatVectors = new Float32Array(await binRes.arrayBuffer());
    return new BrazilianArtSearchEngine(artworks, flatVectors, dimensions);
  }

  private dotProduct(queryVec: Float32Array, vectorIndex: number): number {
    const offset = vectorIndex * this.dimensions;
    let sum = 0;
    for (let i = 0; i < this.dimensions; i++) sum += queryVec[i] * this.vectors[offset + i];
    return sum;
  }

  private colorSimilarity(artworkId: string, targetLab: LabColor, tolerance: number): number {
    const palette = this.labCache.get(artworkId);
    if (!palette || palette.length === 0) return 0;
    let minDistance = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const dist = deltaE(palette[i], targetLab) + i * 2.5;
      if (dist < minDistance) minDistance = dist;
    }
    return minDistance > tolerance ? 0 : Math.max(0, 1 - minDistance / tolerance);
  }

  private lexicalScore(docIndex: number, tokens: string[]): number {
    if (tokens.length === 0) return 0;
    const haystack = this.searchableTextCache[docIndex];
    let hits = 0;
    for (const token of tokens) if (haystack.includes(token)) hits++;
    return hits / tokens.length;
  }

  public findSimilar(artworkId: string, limit = 12): SearchResult[] {
    const target = this.artworks.find((a) => a.id === artworkId);
    if (!target) return [];
    const offset = target.semantic.vector_index * this.dimensions;
    const referenceVector = this.vectors.subarray(offset, offset + this.dimensions);
    return this.search({ queryVector: referenceVector, limit: limit + 1 })
      .filter((r) => r.artwork.id !== artworkId)
      .slice(0, limit);
  }

  public search(filters: SearchFilters): SearchResult[] {
    const { queryText, queryVector, targetHex, colorTolerance = 38, decadeRange, category, institution, limit = 40 } = filters;
    const targetLab = targetHex ? hexToLab(targetHex) : null;
    const tokens = queryText ? normalizeText(queryText).split(/\s+/).filter((t) => t.length > 2) : [];
    const hasVector = Boolean(queryVector && queryVector.length === this.dimensions);
    const hasColor = Boolean(targetLab);
    const hasText = tokens.length > 0;
    const scored: SearchResult[] = [];

    for (let i = 0; i < this.artworks.length; i++) {
      const art = this.artworks[i];
      if (decadeRange) {
        const dec = art.chronology.decade;
        if (dec === null || dec < decadeRange[0] || dec > decadeRange[1]) continue;
      }
      if (category && art.classification.category !== category) continue;
      if (institution && art.source.institution !== institution) continue;

      let colorScore = 0;
      if (targetLab) {
        colorScore = this.colorSimilarity(art.id, targetLab, colorTolerance);
        if (colorScore === 0) continue;
      }

      let semanticScore = 0;
      if (hasVector && queryVector) {
        semanticScore = Math.max(0, (this.dotProduct(queryVector, art.semantic.vector_index) + 1) / 2);
      }

      const lexScore = hasText ? this.lexicalScore(i, tokens) : 0;

      let finalScore = 0;
      if (hasVector && hasColor) finalScore = semanticScore * 0.65 + colorScore * 0.25 + lexScore * 0.10;
      else if (hasVector) finalScore = semanticScore * 0.85 + lexScore * 0.15;
      else if (hasColor) finalScore = colorScore * 0.85 + lexScore * 0.15;
      else if (hasText) finalScore = lexScore;
      else finalScore = 1;

      if (finalScore > 0) {
        scored.push({
          artwork: art,
          score: Number(finalScore.toFixed(4)),
          breakdown: {
            semantic: Number(semanticScore.toFixed(4)),
            lexical: Number(lexScore.toFixed(4)),
            color: Number(colorScore.toFixed(4)),
          },
        });
      }
    }

    if (!hasVector && !hasColor && !hasText) {
      return scored
        .sort((a, b) => (a.artwork.chronology.year_start ?? 9999) - (b.artwork.chronology.year_start ?? 9999))
        .slice(0, limit);
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
```

---

## 6. Interface Editorial Front-End (Astro + Tailwind)

### 6.1. Estrutura de Arquivos
```text
acervo-br-web/
├── public/
│   ├── _headers
│   └── data/
│       ├── obras-enriquecidas.json
│       └── embeddings.f32
├── src/
│   ├── lib/
│   │   └── hybrid-search.ts
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       └── embed-query.ts
│   └── styles/
│       └── global.css
└── astro.config.mjs
```

### 6.2. Endpoint de Vetorização de Query (`src/pages/api/embed-query.ts`)

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const apiKey =
    (locals as any)?.runtime?.env?.GEMINI_API_KEY ??
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY ausente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { query } = await request.json();
  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Consulta inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: query.trim() }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Falha ao vetorizar consulta" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await response.json();
  const values: number[] = data?.embedding?.values ?? [];
  const norm = Math.sqrt(values.reduce((acc, v) => acc + v * v, 0)) || 1;
  const normalized = values.map((v) => v / norm);

  return new Response(JSON.stringify({ vector: normalized }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
```

### 6.3. Página Principal (`src/pages/index.astro`)
Inclui:
* Barra de busca semântica com sugestões temáticas.
* Seletor de paleta curada (`Ocre Mineiro`, `Azul Colonial`, `Verde Tropical`, `Vermelho Urucum`, `Areia & Cru`, `Carvão`) + seletor HEX livre.
* Linha do tempo interativa por décadas (`1700 — 2020`) e filtro por tipologia (`pintura`, `escultura`, `gravura`, `desenho`, `fotografia`, `arte_popular`).
* Grade *masonry* responsiva com proporção pré-alocada (`aspect-ratio`) para evitar CLS.
* Gaveta/modal de inspeção com descrição visual VLM, paleta clicável, link para o acervo original e grade de 4 obras mais próximas no espaço vetorial.

---

## 7. Deploy e Cache na Edge (Cloudflare Pages)

### 7.1. `astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "passthrough",
  }),
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2022",
      cssMinify: true,
    },
  },
});
```

### 7.2. `public/_headers`

```text
/data/embeddings.f32
  Content-Type: application/octet-stream
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Access-Control-Allow-Origin: *

/data/obras-enriquecidas.json
  Content-Type: application/json; charset=utf-8
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 7.3. Checklist de Execução e Publicação
1. Executar `bun run ingest-tainacan.ts` para coletar e normalizar os registros dos museus públicos.
2. Executar `GEMINI_API_KEY="..." bun run enrich-semantic.ts` para gerar `obras-enriquecidas.json` e `embeddings.f32`.
3. Copiar ambos os arquivos gerados para `public/data/` na aplicação Astro.
4. Configurar o deploy no Cloudflare Pages com build command `bun run build`, diretório de saída `dist` e variável secreta `GEMINI_API_KEY` em **Settings → Environment variables → Production**.