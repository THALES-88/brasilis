import { normalizeText } from "./hybrid-search";
import type { ArtworkRecord, SourceProvider } from "../types/art";

export interface ArtistEntityGroup {
  entityKey: string;
  wikidata_qid: string | null;
  canonicalName: string;
  variantNames: string[];
  birth_year: number | null;
  death_year: number | null;
  origin_state: string | null;
  bio_pt: string;
  works: ArtworkRecord[];
  institutions: string[];
  movements: string[];
  providers: SourceProvider[];
}

export function getProviderLabel(provider: SourceProvider): string {
  switch (provider) {
    case "tainacan":
      return "Tainacan / Ibram";
    case "wikidata":
      return "Wikidata & Wikimedia GLAM";
    case "brasiliana":
      return "Brasiliana Iconográfica";
    case "institutional_api":
      return "Catálogo Institucional";
  }
}

export function getItauEncyclopediaSearchUrl(query: string): string {
  return `https://enciclopedia.itaucultural.org.br/busca?q=${encodeURIComponent(query)}`;
}

/**
 * Unifies artist records across institutions using Wikidata QID as primary entity key
 * (preventing duplicate entries when museums spell names differently, e.g. "Tarsila" vs "Tarsila do Amaral").
 */
export function groupArtistsByEntity(
  artworks: ArtworkRecord[]
): ArtistEntityGroup[] {
  const map = new Map<string, ArtistEntityGroup>();
  const nameFreq = new Map<string, Map<string, number>>();

  for (const art of artworks) {
    const qid = art.artist.wikidata_qid?.trim() || null;
    const key = qid
      ? `qid:${qid.toUpperCase()}`
      : `name:${normalizeText(art.artist.name)}`;

    let freqMap = nameFreq.get(key);
    if (!freqMap) {
      freqMap = new Map<string, number>();
      nameFreq.set(key, freqMap);
    }
    freqMap.set(art.artist.name, (freqMap.get(art.artist.name) ?? 0) + 1);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        entityKey: key,
        wikidata_qid: qid ? qid.toUpperCase() : null,
        canonicalName: art.artist.name,
        variantNames: [art.artist.name],
        birth_year: art.artist.birth_year,
        death_year: art.artist.death_year,
        origin_state: art.artist.origin_state,
        bio_pt: art.artist.bio_pt,
        works: [art],
        institutions: [art.source.institution],
        movements: [...art.classification.movements],
        providers: [art.source.provider],
      });
    } else {
      existing.works.push(art);
      if (!existing.variantNames.includes(art.artist.name)) {
        existing.variantNames.push(art.artist.name);
      }
      if (!existing.birth_year && art.artist.birth_year) {
        existing.birth_year = art.artist.birth_year;
      }
      if (!existing.death_year && art.artist.death_year) {
        existing.death_year = art.artist.death_year;
      }
      if (!existing.origin_state && art.artist.origin_state) {
        existing.origin_state = art.artist.origin_state;
      }
      if (art.artist.bio_pt.length > existing.bio_pt.length) {
        existing.bio_pt = art.artist.bio_pt;
      }
      if (!existing.institutions.includes(art.source.institution)) {
        existing.institutions.push(art.source.institution);
      }
      for (const m of art.classification.movements) {
        if (!existing.movements.includes(m)) existing.movements.push(m);
      }
      if (!existing.providers.includes(art.source.provider)) {
        existing.providers.push(art.source.provider);
      }
    }
  }

  for (const [key, group] of map.entries()) {
    const freqMap = nameFreq.get(key);
    if (freqMap && group.variantNames.length > 1) {
      group.canonicalName = [...group.variantNames].sort((a, b) => {
        const diff = (freqMap.get(b) ?? 0) - (freqMap.get(a) ?? 0);
        return diff !== 0 ? diff : b.length - a.length;
      })[0];
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.works.length - a.works.length ||
      a.canonicalName.localeCompare(b.canonicalName, "pt-BR")
  );
}

export function filterArtistEntities(
  groups: ArtistEntityGroup[],
  filterText: string
): ArtistEntityGroup[] {
  const q = normalizeText(filterText).trim();
  if (!q) return groups;
  return groups.filter((group) => {
    const hay = normalizeText(
      [
        group.canonicalName,
        group.variantNames.join(" "),
        group.wikidata_qid ?? "",
        group.origin_state ?? "",
        group.movements.join(" "),
        group.institutions.join(" "),
        group.bio_pt,
      ].join(" ")
    );
    return hay.includes(q);
  });
}
