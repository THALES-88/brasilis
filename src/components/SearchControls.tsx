import type { FormEvent } from "react";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import type { ArtworkCategory, RightsStatus, SourceProvider } from "../types/art";

interface SearchControlsProps {
  queryInput: string;
  onQueryInputChange: (val: string) => void;
  onSubmitQuery: (queryOverride?: string) => void;
  selectedHex: string | null;
  onClearHex: () => void;
  decadeRange: [number, number];
  onClearDecadeRange: () => void;
  selectedCategory: ArtworkCategory | "todas";
  onClearCategory: () => void;
  selectedInstitutionName: string | null;
  onClearInstitution: () => void;
  selectedArtistName: string | null;
  selectedArtistQid: string | null;
  onClearArtist: () => void;
  selectedRights: RightsStatus | "todos";
  onClearRights: () => void;
  selectedProvider: SourceProvider | "todos";
  onClearProvider: () => void;
  onResetAll: () => void;
  onOpenMegaMenu: () => void;
  isSearchingVector: boolean;
  searchModeLabel: string | null;
  totalResults: number;
  apiWarning: string | null;
}

const SUGGESTED_QUERIES = [
  "abaporu e antropofagia modernista",
  "profetas em pedra-sabão",
  "sertão árido e retirantes",
  "samba e morros cariocas",
  "geometria sagrada afro-brasileira",
];

const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  pintura: "Pintura",
  escultura: "Escultura",
  gravura: "Gravura",
  desenho: "Desenho",
  fotografia: "Fotografia",
  instalacao: "Instalação",
  arte_popular: "Arte Popular",
  outro: "Outro",
};

const RIGHTS_LABELS: Record<RightsStatus, string> = {
  public_domain: "Domínio Público",
  cc_open: "Licença Aberta",
  copyright_restricted: "Referencial",
  unknown: "Não especificado",
};

const PROVIDER_LABELS: Record<SourceProvider, string> = {
  tainacan: "Tainacan / Ibram",
  wikidata: "Wikidata GLAM",
  brasiliana: "Brasiliana",
  institutional_api: "Catálogos Institucionais",
};

export function SearchControls({
  queryInput,
  onQueryInputChange,
  onSubmitQuery,
  selectedHex,
  onClearHex,
  decadeRange,
  onClearDecadeRange,
  selectedCategory,
  onClearCategory,
  selectedInstitutionName,
  onClearInstitution,
  selectedArtistName,
  selectedArtistQid,
  onClearArtist,
  selectedRights,
  onClearRights,
  selectedProvider,
  onClearProvider,
  onResetAll,
  onOpenMegaMenu,
  isSearchingVector,
  searchModeLabel,
  totalResults,
  apiWarning,
}: SearchControlsProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitQuery();
  };

  const hasCustomDecade = decadeRange[0] !== 1640 || decadeRange[1] !== 2030;
  const hasActiveFilters =
    Boolean(queryInput.trim()) ||
    Boolean(selectedHex) ||
    hasCustomDecade ||
    selectedCategory !== "todas" ||
    Boolean(selectedInstitutionName) ||
    Boolean(selectedArtistName) ||
    Boolean(selectedArtistQid) ||
    selectedRights !== "todos" ||
    selectedProvider !== "todos";

  return (
    <section
      aria-label="Pesquisa semântica do acervo"
      className="border-b border-[#EAE8E3] bg-[#FAFAF8]"
    >
      <div className="mx-auto max-w-[1360px] px-5 pt-12 pb-9 sm:px-8 sm:pt-16 sm:pb-10">
        {/* Minimalist Gallery Hero Header (inspired by lastmuseum.com) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] text-[#706D67] uppercase">
            Acervo Digital Brasileiro · 1640 — 2025
          </p>
          <h1
            className="font-editorial mt-3 text-4xl font-normal tracking-tight text-[#111110] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]"
            style={{ textWrap: "balance" }}
          >
            Pesquise a arte brasileira por atmosfera, luz, pigmento ou conceito.
          </h1>
        </div>

        {/* Clean Central Semantic Search Input */}
        <form onSubmit={handleFormSubmit} className="mx-auto mt-8 max-w-2xl">
          <label htmlFor="semantic-search-input" className="sr-only">
            Descreva uma cena, atmosfera, movimento ou artista brasileiro
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#706D67]"
                aria-hidden="true"
              />
              <input
                id="semantic-search-input"
                type="search"
                value={queryInput}
                onChange={(e) => onQueryInputChange(e.target.value)}
                placeholder='Ex.: "paisagem mineira ao entardecer" ou "geometria construtiva"'
                className="h-12 w-full border border-[#DCDAD3] bg-white pr-10 pl-11 text-sm text-[#111110] placeholder:text-[#8E8A82] transition-colors focus:border-[#111110] focus:outline-none"
              />
              {queryInput && (
                <button
                  type="button"
                  aria-label="Limpar texto da busca"
                  onClick={() => {
                    onQueryInputChange("");
                    onSubmitQuery("");
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-[#706D67] hover:text-[#111110]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearchingVector}
              className="h-12 cursor-pointer border border-[#111110] bg-[#111110] px-7 text-xs font-medium tracking-wider text-white uppercase transition-colors hover:bg-[#8B3A1E] hover:border-[#8B3A1E] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isSearchingVector ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </form>

        {/* Quiet Inline Prompt Whispers */}
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[#706D67]">
          {SUGGESTED_QUERIES.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                onQueryInputChange(prompt);
                onSubmitQuery(prompt);
              }}
              className="cursor-pointer border-b border-transparent pb-0.5 transition-colors hover:border-[#111110] hover:text-[#111110]"
            >
              “{prompt}”
            </button>
          ))}
        </div>

        {/* Quiet Status & Active Context Strip */}
        <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-[#EAE8E3] pt-4 text-xs text-[#706D67]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono tabular-nums text-[#111110]">
              {totalResults}{" "}
              {totalResults === 1 ? "obra" : "obras"}
              {searchModeLabel ? ` · ${searchModeLabel}` : ""}
            </span>

            {selectedCategory !== "todas" && (
              <button
                type="button"
                onClick={onClearCategory}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#DCDAD3] bg-white px-2.5 py-1 text-[#111110] hover:border-[#111110]"
              >
                <span>{CATEGORY_LABELS[selectedCategory]}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {selectedHex && (
              <button
                type="button"
                onClick={onClearHex}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#DCDAD3] bg-white px-2.5 py-1 font-mono text-[#111110] hover:border-[#111110]"
              >
                <span
                  className="h-2.5 w-2.5 border border-black/15"
                  style={{ backgroundColor: selectedHex }}
                  aria-hidden="true"
                />
                <span>{selectedHex}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {hasCustomDecade && (
              <button
                type="button"
                onClick={onClearDecadeRange}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#DCDAD3] bg-white px-2.5 py-1 font-mono tabular-nums text-[#111110] hover:border-[#111110]"
              >
                <span>
                  {decadeRange[0]}–{decadeRange[1]}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}

            {selectedInstitutionName && (
              <button
                type="button"
                onClick={onClearInstitution}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#8B3A1E] bg-white px-2.5 py-1 text-[#8B3A1E] hover:bg-[#8B3A1E] hover:text-white"
              >
                <span>{selectedInstitutionName}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {selectedArtistName && (
              <button
                type="button"
                onClick={onClearArtist}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#1E3A5F] bg-white px-2.5 py-1 text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white"
              >
                <span>
                  {selectedArtistName}
                  {selectedArtistQid ? ` (${selectedArtistQid})` : ""}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}

            {selectedRights !== "todos" && (
              <button
                type="button"
                onClick={onClearRights}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#DCDAD3] bg-white px-2.5 py-1 text-[#111110] hover:border-[#111110]"
              >
                <span>{RIGHTS_LABELS[selectedRights]}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {selectedProvider !== "todos" && (
              <button
                type="button"
                onClick={onClearProvider}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#DCDAD3] bg-white px-2.5 py-1 text-[#111110] hover:border-[#111110]"
              >
                <span>{PROVIDER_LABELS[selectedProvider]}</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetAll}
                className="inline-flex cursor-pointer items-center gap-1.5 text-[#706D67] hover:text-[#111110] whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Restaurar acervo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenMegaMenu}
              className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-[#111110] underline decoration-[#DCDAD3] underline-offset-4 transition-colors hover:decoration-[#111110] whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refinar por cor, época ou museu</span>
            </button>
          </div>
        </div>

        {apiWarning && (
          <p
            role="status"
            className="mt-4 border border-[#EAE8E3] bg-white px-4 py-2.5 text-center text-xs text-[#706D67]"
          >
            {apiWarning}
          </p>
        )}
      </div>
    </section>
  );
}
