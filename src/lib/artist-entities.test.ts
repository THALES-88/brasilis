import test from "node:test";
import assert from "node:assert/strict";
import { ARTWORKS_CATALOG } from "../data/catalog";
import { BrazilianArtSearchEngine } from "./hybrid-search";
import {
  filterArtistEntities,
  getProviderLabel,
  groupArtistsByEntity,
} from "./artist-entities";
import type { ArtworkRecord } from "../types/art";

test("groupArtistsByEntity unifies variant artist spellings sharing a Wikidata QID", () => {
  const base = ARTWORKS_CATALOG.find((a) => a.artist.wikidata_qid === "Q466627")!;
  const variantA: ArtworkRecord = {
    ...base,
    id: "test-tarsila-1",
    artist: { ...base.artist, name: "Tarsila" },
    source: { ...base.source, institution: "MASP" },
  };
  const variantB: ArtworkRecord = {
    ...base,
    id: "test-tarsila-2",
    artist: { ...base.artist, name: "Amaral, Tarsila do" },
    source: { ...base.source, institution: "Pinacoteca de São Paulo" },
  };

  const groups = groupArtistsByEntity([variantA, variantB]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].wikidata_qid, "Q466627");
  assert.equal(groups[0].works.length, 2);
  assert.equal(groups[0].institutions.length, 2);
  assert.deepEqual(groups[0].variantNames, ["Tarsila", "Amaral, Tarsila do"]);

  const qidMatch = filterArtistEntities(groups, "Q466627");
  assert.equal(qidMatch.length, 1);
});

test("expanded catalog artists all unify cleanly and BrazilianArtSearchEngine filters by artistQid and sourceProvider", () => {
  const groups = groupArtistsByEntity(ARTWORKS_CATALOG);
  assert.ok(groups.length >= 60, `Expected >= 60 unified artists, got ${groups.length}`);

  const tarsilaGroup = groups.find((g) => g.wikidata_qid === "Q466627");
  assert.ok(tarsilaGroup, "Expected Tarsila do Amaral group Q466627");
  assert.ok(tarsilaGroup.works.length >= 7);

  const aleijadinhoGroup = groups.find((g) => g.wikidata_qid === "Q379714");
  assert.ok(aleijadinhoGroup, "Expected Aleijadinho group Q379714");
  assert.ok(aleijadinhoGroup.works.length >= 15, `Expected >= 15 Aleijadinho sculptures, got ${aleijadinhoGroup.works.length}`);
  assert.equal(aleijadinhoGroup.canonicalName, "Antônio Francisco Lisboa (Aleijadinho)");

  const vikGroup = groups.find((g) => g.wikidata_qid === "Q1288454");
  assert.ok(vikGroup, "Expected Vik Muniz group Q1288454");
  assert.ok(vikGroup.works.length >= 5, `Expected >= 5 Vik Muniz works, got ${vikGroup.works.length}`);

  const portinariGroup = groups.find((g) => g.wikidata_qid === "Q319532");
  assert.ok(portinariGroup, "Expected Candido Portinari group Q319532");
  assert.ok(portinariGroup.works.length >= 8, `Expected >= 8 Portinari works, got ${portinariGroup.works.length}`);

  const diCavalcantiGroup = groups.find((g) => g.wikidata_qid === "Q1793637");
  assert.ok(diCavalcantiGroup, "Expected Di Cavalcanti group Q1793637");
  assert.ok(diCavalcantiGroup.works.length >= 4, `Expected >= 4 Di Cavalcanti works, got ${diCavalcantiGroup.works.length}`);

  const engine = new BrazilianArtSearchEngine(ARTWORKS_CATALOG);
  const byQid = engine.search({ artistQid: "Q466627" });
  assert.equal(byQid.length, tarsilaGroup.works.length);

  const tainacanOnly = engine.search({ sourceProvider: "tainacan" });
  assert.ok(tainacanOnly.length >= 10);
  assert.ok(tainacanOnly.every((r) => r.artwork.source.provider === "tainacan"));
  assert.equal(getProviderLabel("tainacan"), "Tainacan / Ibram");
});
