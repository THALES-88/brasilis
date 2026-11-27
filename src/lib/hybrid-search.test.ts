import test from "node:test";
import assert from "node:assert/strict";
import { ARTWORKS_CATALOG } from "../data/catalog";
import {
  BrazilianArtSearchEngine,
  deltaE,
  dotProduct,
  hexToLab,
  l2Normalize,
} from "./hybrid-search";

test("hexToLab and deltaE compute zero distance for identical colors and distinguish warm vs cool", () => {
  const ocre = hexToLab("#B97D2C");
  const ocreCopy = hexToLab("#B97D2C");
  const terracotta = hexToLab("#9E3324");
  const azul = hexToLab("#1B3B6F");

  assert.equal(deltaE(ocre, ocreCopy), 0);
  assert.ok(deltaE(ocre, terracotta) < deltaE(ocre, azul));
});

test("l2Normalize produces unit vector and dotProduct equals 1 for identical directions", () => {
  const normalized = l2Normalize([3, 4, 0]);
  assert.ok(Math.abs(dotProduct(normalized, normalized) - 1) < 1e-6);
});

test("BrazilianArtSearchEngine matches Portuguese semantic queries without exact title words", () => {
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const results = engine.search({ queryText: "paisagem tropical geometrica" });
  assert.ok(results.length > 0, "Expected semantic results for tropical geometric landscape");
  const topIds = results.slice(0, 3).map((r) => r.artwork.id);
  assert.ok(
    topIds.includes("br-modernismo-004"),
    `Expected Tarsila modernist tropical painting in top 3, got ${topIds.join(", ")}`
  );
});

test("BrazilianArtSearchEngine blends server semantic scores when provided", () => {
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const results = engine.search({
    queryText: "ritual ancestral",
    semanticScores: {
      "br-concretismo-009": 0.98,
      "br-barroco-001": 0.25,
    },
  });

  assert.equal(results[0].artwork.id, "br-concretismo-009");
  assert.ok(results[0].breakdown.semantic > 0.9);
});

test("BrazilianArtSearchEngine filters strictly by decadeRange, category, and institution", () => {
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const modernist1920sTo50s = engine.search({
    decadeRange: [1920, 1959],
    category: "pintura",
  });

  assert.ok(modernist1920sTo50s.length > 0);
  for (const res of modernist1920sTo50s) {
    assert.equal(res.artwork.classification.category, "pintura");
    const year = res.artwork.chronology.year_start ?? 0;
    assert.ok(year >= 1920 && year <= 1959);
  }

  const maspOnly = engine.search({ institutionId: "masp" });
  assert.ok(maspOnly.length >= 2);
  for (const res of maspOnly) {
    assert.equal(res.artwork.source.institution_id, "masp");
  }
});

test("BrazilianArtSearchEngine filters by chromatic similarity using targetHex", () => {
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const blueResults = engine.search({ targetHex: "#14325B", colorTolerance: 35 });
  assert.ok(blueResults.length > 0);
  assert.equal(blueResults[0].artwork.id, "br-concretismo-007");
});

test("findSimilar excludes target artwork and returns closest neighbors", () => {
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const similar = engine.findSimilar("br-concretismo-008", 4);
  assert.equal(similar.length, 4);
  assert.ok(similar.every((r) => r.artwork.id !== "br-concretismo-008"));
  const simIds = similar.map((r) => r.artwork.id);
  assert.ok(
    simIds.includes("br-concretismo-009") ||
      simIds.includes("br-concretismo-007") ||
      simIds.includes("br-canon-clark-grega") ||
      simIds.includes("br-canon-clark-unidade1") ||
      simIds.includes("br-canon-oiticica-metaesquema"),
    "Expected related geometric/constructive works among nearest neighbors"
  );
});

test("expanded catalog covers 300+ artworks across all categories including instalacao and canonical masters", () => {
  assert.ok(
    ARTWORKS_CATALOG.length >= 300,
    `Expected >= 300 artworks in expanded catalog, got ${ARTWORKS_CATALOG.length}`
  );
  const categories = new Set(ARTWORKS_CATALOG.map((a) => a.classification.category));
  for (const cat of [
    "pintura",
    "escultura",
    "gravura",
    "desenho",
    "fotografia",
    "instalacao",
    "arte_popular",
  ]) {
    assert.ok(categories.has(cat as any), `Missing category ${cat}`);
  }
  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);

  const abaporu = engine.search({ queryText: "abaporu" });
  assert.ok(abaporu.length > 0, "Expected Abaporu search match");
  assert.equal(abaporu[0].artwork.wikidata_qid, "Q4663455");

  const installations = engine.search({ category: "instalacao" });
  assert.ok(installations.length >= 10, `Expected >= 10 installations, got ${installations.length}`);

  const drawings = engine.search({ category: "desenho" });
  assert.ok(drawings.length >= 15, `Expected >= 15 drawings, got ${drawings.length}`);
  const colonial = engine.search({ decadeRange: [1640, 1800] });
  assert.ok(colonial.length >= 5, `Expected >= 5 colonial works, got ${colonial.length}`);
});
