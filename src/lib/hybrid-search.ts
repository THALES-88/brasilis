import type {
  ArtworkCategory,
  ArtworkRecord,
  RightsStatus,
  SourceProvider,
} from "../types/art";

export interface SearchFilters {
  queryText?: string;
  /** Optional server-computed Gemini embedding similarity scores keyed by artwork ID (0..1) */
  semanticScores?: Record<string, number>;
  targetHex?: string;
  colorTolerance?: number;
  decadeRange?: [number, number];
  category?: ArtworkCategory | "todas";
  institutionId?: string;
  artistName?: string;
  artistQid?: string;
  rightsStatus?: RightsStatus | "todos";
  sourceProvider?: SourceProvider | "todos";
  limit?: number;
}

export interface SearchResult {
  artwork: ArtworkRecord;
  score: number;
  breakdown: {
    semantic: number;
    lexical: number;
    color: number;
  };
}

export type LabColor = [number, number, number];

export function hexToLab(hex: string): LabColor {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean.padEnd(6, "0");
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [50, 0, 0];

  let r = ((num >> 16) & 255) / 255;
  let g = ((num >> 8) & 255) / 255;
  let b = (num & 255) / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = f(x);
  y = f(y);
  z = f(z);

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function deltaE(a: LabColor, b: LabColor): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

export function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

export function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Maps Portuguese free-text atmospheric/visual queries into the 16 curatorial concept axes
 * for zero-latency local semantic projection when server-side Gemini embeddings are absent.
 */
const CONCEPT_LEXICON: Array<{ axis: number; keywords: string[]; weight: number }> = [
  { axis: 0, keywords: ["sacro", "barroco", "rococo", "profeta", "profetas", "religioso", "igreja", "dourado", "ouro", "colonial", "espiritual", "altar", "virgem", "cristo", "missa", "devocao", "ataide", "congonhas"], weight: 1.0 },
  { axis: 1, keywords: ["paisagem", "natureza", "mar", "marinha", "baia", "guanabara", "praia", "enseada", "rio", "floresta", "agua", "amanhecer", "montanha", "serra", "horizonte", "arvore", "cachoeira"], weight: 1.0 },
  { axis: 2, keywords: ["retrato", "auto-retrato", "autorretrato", "mulher", "rosto", "senhora", "menina", "pessoa", "figura", "olhar", "dignidade", "humano", "busto", "estudo", "operarios", "mocas"], weight: 1.0 },
  { axis: 3, keywords: ["geometria", "geometrica", "geometrico", "concreto", "concretismo", "neoconcretismo", "abstrato", "abstracao", "triangulo", "construtivo", "construtiva", "simetria", "matematica", "linha", "plano", "bicho", "metaesquema"], weight: 1.0 },
  { axis: 4, keywords: ["sertao", "arido", "seca", "nordeste", "cacto", "mandacaru", "terra", "rachada", "tempestade", "caipira", "bandeirante", "rural", "fazenda", "retirantes", "migracao"], weight: 1.0 },
  { axis: 5, keywords: ["urbano", "festa", "samba", "musica", "violao", "morro", "carnaval", "junina", "povo", "danca", "rua", "praca", "porto", "mercado", "cidade", "mural"], weight: 1.0 },
  { axis: 6, keywords: ["melancolico", "melancolica", "sombra", "drama", "dramatico", "noturno", "noite", "chiaroscuro", "solene", "tragico", "silencio", "silencioso", "crepusculo"], weight: 1.0 },
  { axis: 7, keywords: ["tropical", "vibrante", "verde", "solar", "bananeira", "exuberante", "cor", "colorido", "fruta", "natureza-morta", "flora", "palmeira", "antropofagia", "abaporu"], weight: 1.0 },
  { axis: 8, keywords: ["escultura", "estatua", "cedro", "madeira", "barro", "ceramica", "terracota", "vulto", "talha", "bronze", "marmore", "monumento", "pedra-sabao", "aleijadinho", "instalacao", "inhotim"], weight: 1.0 },
  { axis: 9, keywords: ["gravura", "xilogravura", "litografia", "desenho", "aquarela", "nanquim", "cordel", "papel", "entalhe", "tinta", "passaro", "sol", "estampa", "monotipia"], weight: 1.0 },
  { axis: 10, keywords: ["fotografia", "foto", "documental", "bruma", "nevoa", "amazonia", "canoa", "prata", "albumina", "preto e branco", "monocromatico", "vik muniz", "chocolate", "acucar"], weight: 1.0 },
  { axis: 11, keywords: ["afro", "ancestral", "negra", "negro", "emblema", "ritual", "sagrado", "buzio", "bahia", "coral", "baiana", "orixa"], weight: 1.0 },
  { axis: 12, keywords: ["academismo", "academico", "oitocentista", "classico", "seculo xix", "imperial", "viagem", "brasiliana", "pedro americo", "victor meirelles"], weight: 0.9 },
  { axis: 13, keywords: ["modernismo", "modernista", "1922", "pau-brasil", "antropofagia", "vanguarda", "tarsila", "portinari", "volpi", "brecheret", "visconti", "di cavalcanti", "malfatti", "segall", "abaporu"], weight: 0.9 },
  { axis: 14, keywords: ["popular", "folclore", "artesanal", "regional", "caruaru", "pifano", "sanfona", "violeiro", "bispo", "bordado"], weight: 1.0 },
  { axis: 15, keywords: ["arquitetura", "fachada", "casario", "casa", "janela", "bandeirinhas", "cidade", "palacio", "ponte", "aqueduto", "olinda", "azulejo", "azulejaria", "bulcao", "pampulha", "brasilia"], weight: 1.0 },
];

export function projectQueryToConceptVector(query: string): number[] | null {
  const norm = normalizeText(query).trim();
  if (!norm) return null;
  const vec = new Array<number>(16).fill(0);
  let matched = false;

  for (const entry of CONCEPT_LEXICON) {
    for (const kw of entry.keywords) {
      if (norm.includes(kw)) {
        vec[entry.axis] += entry.weight;
        matched = true;
      }
    }
  }

  return matched ? l2Normalize(vec) : null;
}

export class BrazilianArtSearchEngine {
  private artworks: ArtworkRecord[];
  private labCache: Map<string, LabColor[]>;
  private searchableTextCache: string[];
  private normalizedConcepts: number[][];

  constructor(artworks: ArtworkRecord[]) {
    this.artworks = artworks;
    this.labCache = new Map();
    this.normalizedConcepts = artworks.map((art) =>
      l2Normalize(art.semantic.concept_vector)
    );
    this.searchableTextCache = artworks.map((art) => {
      this.labCache.set(
        art.id,
        (art.media.dominant_colors || []).map(hexToLab)
      );
      return normalizeText(
        [
          art.title,
          art.artist.name,
          art.artist.origin_state ?? "",
          art.classification.medium,
          art.classification.category,
          art.classification.movements.join(" "),
          art.source.institution,
          art.source.institution_city ?? "",
          art.semantic.visual_caption_pt,
          art.semantic.tags_pt.join(" "),
          art.semantic.mood.join(" "),
        ].join(" ")
      );
    });
  }

  private colorSimilarity(
    artworkId: string,
    targetLab: LabColor,
    tolerance: number
  ): number {
    const palette = this.labCache.get(artworkId);
    if (!palette || palette.length === 0) return 0;

    let minDistance = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const dist = deltaE(palette[i], targetLab) + i * 2.5;
      if (dist < minDistance) minDistance = dist;
    }

    if (minDistance > tolerance) return 0;
    return Math.max(0, 1 - minDistance / tolerance);
  }

  private lexicalScore(docIndex: number, tokens: string[]): number {
    if (tokens.length === 0) return 0;
    const haystack = this.searchableTextCache[docIndex];
    let hits = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) hits++;
    }
    return hits / tokens.length;
  }

  public findSimilar(artworkId: string, limit = 4): SearchResult[] {
    const idx = this.artworks.findIndex((a) => a.id === artworkId);
    if (idx === -1) return [];
    const target = this.artworks[idx];
    const targetVec = this.normalizedConcepts[idx];
    const targetLab =
      target.media.dominant_colors[0]
        ? hexToLab(target.media.dominant_colors[0])
        : null;

    const scored: SearchResult[] = [];
    for (let i = 0; i < this.artworks.length; i++) {
      const candidate = this.artworks[i];
      if (candidate.id === artworkId) continue;
      const sem = Math.max(0, dotProduct(targetVec, this.normalizedConcepts[i]));
      const col = targetLab ? this.colorSimilarity(candidate.id, targetLab, 55) : 0;
      const score = sem * 0.78 + col * 0.22;
      scored.push({
        artwork: candidate,
        score: Number(score.toFixed(4)),
        breakdown: {
          semantic: Number(sem.toFixed(4)),
          lexical: 0,
          color: Number(col.toFixed(4)),
        },
      });
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  public search(filters: SearchFilters): SearchResult[] {
    const {
      queryText,
      semanticScores,
      targetHex,
      colorTolerance = 42,
      decadeRange,
      category,
      institutionId,
      artistName,
      artistQid,
      rightsStatus,
      sourceProvider,
      limit = 600,
    } = filters;

    const targetLab = targetHex ? hexToLab(targetHex) : null;
    const tokens = queryText
      ? normalizeText(queryText)
          .split(/\s+/)
          .filter((t) => t.length > 2)
      : [];
    const localConceptVec = queryText
      ? projectQueryToConceptVector(queryText)
      : null;

    const hasServerSemantic = Boolean(
      semanticScores && Object.keys(semanticScores).length > 0
    );
    const hasSemantic = hasServerSemantic || Boolean(localConceptVec);
    const hasColor = Boolean(targetLab);
    const hasText = tokens.length > 0;

    const scored: SearchResult[] = [];

    for (let i = 0; i < this.artworks.length; i++) {
      const art = this.artworks[i];

      if (decadeRange) {
        const year = art.chronology.year_start ?? art.chronology.decade;
        if (year === null || year < decadeRange[0] || year > decadeRange[1]) {
          continue;
        }
      }
      if (category && category !== "todas" && art.classification.category !== category) {
        continue;
      }
      if (institutionId && art.source.institution_id !== institutionId) {
        continue;
      }
      if (artistQid) {
        if (
          (art.artist.wikidata_qid ?? "").toUpperCase() !==
          artistQid.toUpperCase()
        ) {
          continue;
        }
      } else if (
        artistName &&
        !normalizeText(art.artist.name).includes(normalizeText(artistName))
      ) {
        continue;
      }
      if (rightsStatus && rightsStatus !== "todos" && art.rights.status !== rightsStatus) {
        continue;
      }
      if (
        sourceProvider &&
        sourceProvider !== "todos" &&
        art.source.provider !== sourceProvider
      ) {
        continue;
      }

      let colorScore = 0;
      if (targetLab) {
        colorScore = this.colorSimilarity(art.id, targetLab, colorTolerance);
        if (colorScore === 0) continue;
      }

      let semanticScore = 0;
      if (hasServerSemantic && semanticScores && semanticScores[art.id] !== undefined) {
        semanticScore = Math.max(0, Math.min(1, semanticScores[art.id]));
      } else if (localConceptVec) {
        semanticScore = Math.max(
          0,
          dotProduct(localConceptVec, this.normalizedConcepts[i])
        );
      }

      const lexScore = hasText ? this.lexicalScore(i, tokens) : 0;

      let finalScore = 0;
      if (hasSemantic && hasColor) {
        finalScore = semanticScore * 0.6 + colorScore * 0.28 + lexScore * 0.12;
      } else if (hasSemantic) {
        finalScore = semanticScore * 0.72 + lexScore * 0.28;
      } else if (hasColor) {
        finalScore = colorScore * 0.85 + lexScore * 0.15;
      } else if (hasText) {
        finalScore = lexScore;
      } else {
        finalScore = 1;
      }

      // When user typed a text query without color, require non-trivial relevance
      if ((hasText || hasSemantic) && !hasColor && finalScore < 0.08) {
        continue;
      }

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

    if (!hasSemantic && !hasColor && !hasText) {
      return scored
        .sort((a, b) => {
          const aCore = a.artwork.id.startsWith("wd-") ? 1 : 0;
          const bCore = b.artwork.id.startsWith("wd-") ? 1 : 0;
          if (aCore !== bCore) return aCore - bCore;
          return (
            (a.artwork.chronology.year_start ?? 9999) -
            (b.artwork.chronology.year_start ?? 9999)
          );
        })
        .slice(0, limit);
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
