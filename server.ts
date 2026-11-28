import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

interface SemanticDoc {
  id: string;
  title: string;
  document: string;
}

const PORT = Number(process.env.PORT) || 3000;
const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 768;

function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

const docsPath = path.resolve(process.cwd(), "src/data/semantic-docs.json");
const catalogDocs: SemanticDoc[] = JSON.parse(fs.readFileSync(docsPath, "utf-8"));

let cachedDocVectors: Record<string, number[]> | null = null;
let docEmbeddingPromise: Promise<Record<string, number[]>> | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function ensureCatalogEmbeddings(
  ai: GoogleGenAI
): Promise<Record<string, number[]>> {
  if (cachedDocVectors) return cachedDocVectors;
  if (docEmbeddingPromise) return docEmbeddingPromise;

  docEmbeddingPromise = (async () => {
    const vectors: Record<string, number[]> = {};
    const BATCH_SIZE = 50;

    for (let start = 0; start < catalogDocs.length; start += BATCH_SIZE) {
      const batch = catalogDocs.slice(start, start + BATCH_SIZE);
      const result = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: batch.map((d) => d.document),
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: EMBEDDING_DIMENSIONS,
        },
      });

      const embeddings = result.embeddings ?? [];
      batch.forEach((doc, idx) => {
        const vals = embeddings[idx]?.values;
        if (vals && vals.length > 0) {
          vectors[doc.id] = l2Normalize(vals);
        }
      });
    }

    if (Object.keys(vectors).length > 0) {
      cachedDocVectors = vectors;
    }
    return vectors;
  })().finally(() => {
    docEmbeddingPromise = null;
  });

  return docEmbeddingPromise;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    );
    const hasMaps = Boolean(
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    );
    res.json({ ok: true, geminiConfigured: hasGemini, mapsConfigured: hasMaps });
  });

  app.get("/api/maps-config", (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";
    res.json({ apiKey });
  });

  app.post("/api/semantic-search", async (req, res) => {
    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!query || query.length > 500) {
      res.status(400).json({
        error: "Informe uma descrição válida (até 500 caracteres).",
        code: "INVALID_QUERY",
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY não configurada no servidor.",
        code: "MISSING_API_KEY",
      });
      return;
    }

    try {
      const [docVectors, queryResult] = await Promise.all([
        ensureCatalogEmbeddings(ai),
        ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: query,
          config: {
            taskType: "RETRIEVAL_QUERY",
            outputDimensionality: EMBEDDING_DIMENSIONS,
          },
        }),
      ]);

      const queryVals = queryResult.embeddings?.[0]?.values;
      if (!queryVals || queryVals.length === 0) {
        res.status(502).json({
          error: "Não foi possível gerar o vetor semântico para a consulta.",
          code: "EMPTY_EMBEDDING",
        });
        return;
      }

      const normalizedQuery = l2Normalize(queryVals);
      const scores: Record<string, number> = {};

      for (const doc of catalogDocs) {
        const docVec = docVectors[doc.id];
        if (!docVec) continue;
        // Cosine similarity mapped cleanly from [-1, 1] / [0, 1] into [0, 1]
        const sim = dotProduct(normalizedQuery, docVec);
        scores[doc.id] = Number(Math.max(0, Math.min(1, (sim + 1) / 2)).toFixed(4));
      }

      res.json({
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        scores,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "";
      const status =
        message.includes("429") || message.includes("RESOURCE_EXHAUSTED")
          ? 429
          : message.includes("403") || message.includes("PERMISSION_DENIED")
            ? 403
            : 502;
      res.status(status).json({
        error:
          status === 429
            ? "Limite de requisições de embeddings excedido."
            : "Serviço de embeddings temporariamente indisponível.",
        code: "EMBEDDING_UPSTREAM_ERROR",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Acervo Brasilis server running on http://localhost:${PORT}`);
  });
}

startServer();
