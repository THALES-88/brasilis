export type ArtworkCategory =
  | "pintura"
  | "escultura"
  | "gravura"
  | "desenho"
  | "fotografia"
  | "instalacao"
  | "arte_popular"
  | "outro";

export type RightsStatus =
  | "public_domain"
  | "cc_open"
  | "copyright_restricted"
  | "unknown";

export type SourceProvider =
  | "tainacan"
  | "wikidata"
  | "brasiliana"
  | "institutional_api";

export interface ArtworkRecord {
  id: string;
  wikidata_qid: string | null;
  title: string;
  alternative_titles?: string[];
  artist: {
    wikidata_qid: string | null;
    name: string;
    birth_year: number | null;
    death_year: number | null;
    origin_state: string | null;
    bio_pt: string;
  };
  chronology: {
    display_date: string;
    year_start: number | null;
    year_end: number | null;
    decade: number | null;
  };
  classification: {
    medium: string;
    category: ArtworkCategory;
    movements: string[];
    dimensions_cm: {
      height: number | null;
      width: number | null;
      depth: number | null;
    };
  };
  source: {
    provider: SourceProvider;
    institution: string;
    institution_id: string;
    institution_city: string | null;
    inventory_code: string | null;
    record_url: string;
  };
  rights: {
    status: RightsStatus;
    license_code: string | null;
    allow_full_display: boolean;
    notice_pt: string;
  };
  media: {
    thumb_url: string;
    full_url: string | null;
    aspect_ratio: number;
    dominant_colors: string[];
  };
  semantic: {
    visual_caption_pt: string;
    tags_pt: string[];
    mood: string[];
    embedding_model: string;
    vector_index: number;
    /** Normalized 16-dim curatorial concept vector for zero-latency local similarity */
    concept_vector: number[];
  };
}

export interface MuseumInstitution {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  address: string;
  lat: number;
  lng: number;
  collectionFocus: string;
  foundedYear: number;
  openPlatform: string;
  catalogUrl: string;
  highlightPalette: string;
}

export interface OpenAggregator {
  id: string;
  name: string;
  kind: "api_aberta" | "glam_sparql" | "referencia";
  providerKey?: SourceProvider;
  role: string;
  url: string;
}

export interface CuratedPigment {
  name: string;
  hex: string;
  origin: string;
}

export interface MovementEra {
  id: string;
  name: string;
  period: string;
  decadeRange: [number, number];
  summary: string;
  keyCharacteristics: string[];
  featuredArtworkId: string;
}
