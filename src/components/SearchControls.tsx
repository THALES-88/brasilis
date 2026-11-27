import type { FormEvent } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { CURATED_PIGMENTS } from "../data/catalog";
import type { ArtworkCategory, RightsStatus, SourceProvider } from "../types/art";

interface SearchControlsProps {
  queryInput: string;
  onQueryInputChange: (val: string) => void;
  onSubmitQuery: (queryOverride?: string) => void;
  selectedHex: string | null;
  onSelectHex: (hex: string | null) => void;
  decadeRange: [number, number];
  onDecadeRangeChange: (range: [number, number]) => void;
  selectedCategory: ArtworkCategory | "todas";
  onSelectCategory: (cat: ArtworkCategory | "todas") => void;
  selectedInstitutionName: string | null;
  onClearInstitution: () => void;
  selectedArtistName: string | null;
  selectedArtistQid: string | null;
  onClearArtist: () => void;
  selectedRights: RightsStatus | "todos";
  onSelectRights: (status: RightsStatus | "todos") => void;
  selectedProvider: SourceProvider | "todos";
  onSelectProvider: (provider: SourceProvider | "todos") => void;
  onResetAll: () => void;
  isSearchingVector: boolean;
  searchModeLabel: string | null;
  totalResults: number;
  apiWarning: string | null;
}

const SUGGESTED_QUERIES = [
  "abaporu e antropofagia modernista",
  "profetas de aleijadinho em pedra-sabão",
  "os retirantes e sertão árido",
  "samba, morros e murais modernos",
  "desvio para o vermelho e instalação",
  "geometria sagrada afro-brasileira",
];

const CATEGORIES: Array<{ id: ArtworkCategory | "todas"; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "pintura", label: "Pintura" },
  { id: "escultura", label: "Escultura" },
  { id: "gravura", label: "Gravura" },
  { id: "desenho", label: "Desenho" },
  { id: "fotografia", label: "Fotografia" },
  { id: "instalacao", label: "Instalação" },
  { id: "arte_popular", label: "Arte Popular" },
];

export function SearchControls({
  queryInput,
  onQueryInputChange,
  onSubmitQuery,
  selectedHex,
  onSelectHex,
  decadeRange,
  onDecadeRangeChange,
  selectedCategory,
  onSelectCategory,
  selectedInstitutionName,
  onClearInstitution,
  selectedArtistName,
  selectedArtistQid,
  onClearArtist,
  selectedRights,
  onSelectRights,
  selectedProvider,
  onSelectProvider,
  onResetAll,
  isSearchingVector,
  searchModeLabel,
  totalResults,
  apiWarning,
}: SearchControlsProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitQuery();
  };

  const hasActiveFilters =
    Boolean(queryInput.trim()) ||
    Boolean(selectedHex) ||
    decadeRange[0] !== 1640 ||
    decadeRange[1] !== 2030 ||
    selectedCategory !== "todas" ||
    Boolean(selectedInstitutionName) ||
    Boolean(selectedArtistName) ||
    Boolean(selectedArtistQid) ||
    selectedRights !== "todos" ||
    selectedProvider !== "todos";

  return (
    <section
      aria-label="Pesquisa semântica e filtros curatoriais"
      className="border-b border-[#DDD8CE] bg-[#F7F6F2]"
    >
      <div className="mx-auto max-w-[1360px] px-5 pt-10 pb-8 sm:px-8 sm:pt-12">
        {/* Editorial Hero Header */}
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-widest text-[#6E6A63] uppercase">
            Índice Semântico · 1640 — 2025 · Rede de Acervos Públicos Brasileiros
          </p>
          <h1
            className="font-editorial mt-3 text-4xl font-medium tracking-tight text-[#141413] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
            style={{ textWrap: "balance" }}
          >
            Pesquise a arte brasileira por atmosfera, luz, pigmento ou conceito.
          </h1>
        </div>

        {/* Semantic Search Form */}
        <form onSubmit={handleFormSubmit} className="mt-8">
          <label htmlFor="semantic-search-input" className="sr-only">
            Descreva uma cena, atmosfera, movimento ou artista brasileiro
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#6E6A63]"
                aria-hidden="true"
              />
              <input
                id="semantic-search-input"
                type="search"
                value={queryInput}
                onChange={(e) => onQueryInputChange(e.target.value)}
                placeholder='Ex.: "paisagem mineira melancólica ao entardecer" ou "geometria construtiva"'
                className="h-12 w-full border border-[#C8C2B6] bg-white pr-10 pl-11 text-sm text-[#141413] placeholder:text-[#8A857C] focus:border-[#141413] focus:outline-none"
              />
              {queryInput && (
                <button
                  type="button"
                  aria-label="Limpar texto da busca"
                  onClick={() => {
                    onQueryInputChange("");
                    onSubmitQuery("");
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-[#6E6A63] hover:text-[#141413]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearchingVector}
              className="h-12 cursor-pointer border border-[#141413] bg-[#141413] px-7 text-sm font-medium text-[#F7F6F2] transition-colors hover:bg-[#8B3A1E] hover:border-[#8B3A1E] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isSearchingVector ? "Vetorizando..." : "Buscar"}
            </button>
          </div>
        </form>

        {/* Suggested Semantic Prompts */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6E6A63]">
          <span className="font-medium text-[#141413]">Sugestões:</span>
          {SUGGESTED_QUERIES.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                onQueryInputChange(prompt);
                onSubmitQuery(prompt);
              }}
              className="cursor-pointer border-b border-dotted border-[#B7B0A2] pb-0.5 text-left transition-colors hover:border-[#8B3A1E] hover:text-[#8B3A1E]"
            >
              “{prompt}”
            </button>
          ))}
        </div>

        {/* Curated Pigment Palette + Timeline + Category Rail */}
        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[#DDD8CE] pt-6 lg:grid-cols-12 lg:items-end">
          {/* Pigment Swatches */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-[#6E6A63] uppercase">
                Paleta Curada & Cor Dominante
              </span>
              {selectedHex && (
                <button
                  type="button"
                  onClick={() => onSelectHex(null)}
                  className="cursor-pointer font-mono text-xs text-[#8B3A1E] underline hover:text-[#141413]"
                >
                  Limpar cor ({selectedHex})
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {CURATED_PIGMENTS.map((pigment) => {
                const active =
                  selectedHex?.toLowerCase() === pigment.hex.toLowerCase();
                return (
                  <button
                    key={pigment.hex}
                    type="button"
                    onClick={() =>
                      onSelectHex(active ? null : pigment.hex)
                    }
                    aria-pressed={active}
                    title={`${pigment.name} (${pigment.origin})`}
                    className={`group flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? "border-[#141413] bg-[#141413] text-[#F7F6F2]"
                        : "border-[#DDD8CE] bg-[#EFECE6] text-[#141413] hover:border-[#141413]"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 border border-black/15"
                      style={{ backgroundColor: pigment.hex }}
                      aria-hidden="true"
                    />
                    <span>{pigment.name}</span>
                  </button>
                );
              })}

              <label
                className="flex cursor-pointer items-center gap-1.5 border border-[#DDD8CE] bg-white px-2.5 py-1 text-xs text-[#6E6A63] hover:border-[#141413]"
                title="Selecionar cor personalizada em HEX"
              >
                <input
                  type="color"
                  aria-label="Selecionar cor personalizada"
                  value={selectedHex ?? "#8B3A1E"}
                  onChange={(e) => onSelectHex(e.target.value.toUpperCase())}
                  className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="font-mono text-[11px]">HEX</span>
              </label>
            </div>
          </div>

          {/* Interactive Timeline Range */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-[#6E6A63] uppercase">
                Recorte Histórico
              </span>
              <span className="font-mono tabular-figures text-xs font-medium text-[#141413]">
                {decadeRange[0]} — {decadeRange[1]}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="timeline-start"
                  className="block text-[11px] text-[#6E6A63]"
                >
                  De {decadeRange[0]}
                </label>
                <input
                  id="timeline-start"
                  type="range"
                  min={1640}
                  max={2030}
                  step={10}
                  value={decadeRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onDecadeRangeChange([
                      Math.min(val, decadeRange[1]),
                      decadeRange[1],
                    ]);
                  }}
                  className="timeline-slider mt-1 w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="timeline-end"
                  className="block text-[11px] text-[#6E6A63]"
                >
                  Até {decadeRange[1]}
                </label>
                <input
                  id="timeline-end"
                  type="range"
                  min={1640}
                  max={2030}
                  step={10}
                  value={decadeRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onDecadeRangeChange([
                      decadeRange[0],
                      Math.max(val, decadeRange[0]),
                    ]);
                  }}
                  className="timeline-slider mt-1 w-full"
                />
              </div>
            </div>
          </div>

          {/* Rights Filter */}
          <div className="lg:col-span-2">
            <label
              htmlFor="rights-filter"
              className="block text-xs font-medium tracking-wide text-[#6E6A63] uppercase"
            >
              Direitos
            </label>
            <select
              id="rights-filter"
              value={selectedRights}
              onChange={(e) =>
                onSelectRights(e.target.value as RightsStatus | "todos")
              }
              className="mt-2.5 h-9 w-full border border-[#DDD8CE] bg-white px-2.5 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
            >
              <option value="todos">Todos os regimes</option>
              <option value="public_domain">Domínio Público</option>
              <option value="cc_open">Licença Aberta (CC)</option>
              <option value="copyright_restricted">Referencial (Direitos Vigentes)</option>
            </select>
          </div>

          {/* Aggregator / Source Provider Filter */}
          <div className="lg:col-span-2">
            <label
              htmlFor="provider-filter"
              className="block text-xs font-medium tracking-wide text-[#6E6A63] uppercase"
            >
              Fonte / Agregador
            </label>
            <select
              id="provider-filter"
              value={selectedProvider}
              onChange={(e) =>
                onSelectProvider(e.target.value as SourceProvider | "todos")
              }
              className="mt-2.5 h-9 w-full border border-[#DDD8CE] bg-white px-2.5 text-xs text-[#141413] focus:border-[#141413] focus:outline-none"
            >
              <option value="todos">Todas as fontes</option>
              <option value="tainacan">Tainacan / Ibram</option>
              <option value="wikidata">Wikidata & Wikimedia GLAM</option>
              <option value="brasiliana">Brasiliana Iconográfica</option>
              <option value="institutional_api">Catálogos Institucionais</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs + Result Count & Active Context Filters */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDD8CE] pt-4">
          <div
            role="group"
            aria-label="Filtrar por tipologia da obra"
            className="flex flex-wrap items-center gap-1.5"
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-[#141413] text-[#F7F6F2]"
                      : "bg-[#EFECE6] text-[#57534E] hover:bg-[#E5E0D6] hover:text-[#141413]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E6A63]">
            {selectedInstitutionName && (
              <button
                type="button"
                onClick={onClearInstitution}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#8B3A1E] px-2.5 py-1 text-[#8B3A1E] hover:bg-[#8B3A1E] hover:text-white"
              >
                <span>Acervo: {selectedInstitutionName}</span>
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedArtistName && (
              <button
                type="button"
                onClick={onClearArtist}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#1E3A5F] px-2.5 py-1 text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white"
              >
                <span>
                  Artista: {selectedArtistName}
                  {selectedArtistQid ? ` (${selectedArtistQid})` : ""}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}
            <span className="font-mono tabular-figures">
              {totalResults}{" "}
              {totalResults === 1 ? "obra catalogada" : "obras catalogadas"}
              {searchModeLabel ? ` · ${searchModeLabel}` : ""}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetAll}
                className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#141413] underline hover:text-[#8B3A1E]"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {apiWarning && (
          <p
            role="status"
            className="mt-4 border border-[#D6CEBE] bg-[#EFECE6] px-4 py-2.5 text-xs text-[#57534E]"
          >
            {apiWarning}
          </p>
        )}
      </div>
    </section>
  );
}
