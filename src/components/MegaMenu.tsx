import { useEffect, useRef } from "react";
import { Shuffle, X, RotateCcw, ArrowUpRight, Compass } from "lucide-react";
import { BRAZILIAN_MUSEUMS, CURATED_PIGMENTS } from "../data/catalog";
import type {
  ArtworkCategory,
  RightsStatus,
  SourceProvider,
} from "../types/art";
import type { AppSection } from "./Header";

export interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onRandomArtwork: () => void;
  selectedCategory: ArtworkCategory | "todas";
  onSelectCategory: (cat: ArtworkCategory | "todas") => void;
  decadeRange: [number, number];
  onDecadeRangeChange: (range: [number, number]) => void;
  selectedHex: string | null;
  onSelectHex: (hex: string | null) => void;
  selectedInstitutionId: string | null;
  onSelectInstitution: (institutionId: string | null) => void;
  selectedRights: RightsStatus | "todos";
  onSelectRights: (status: RightsStatus | "todos") => void;
  selectedProvider: SourceProvider | "todos";
  onSelectProvider: (provider: SourceProvider | "todos") => void;
  onResetAll: () => void;
  totalCatalogCount: number;
  totalArtistsCount: number;
  hasActiveFilters: boolean;
}

const CATEGORIES: Array<{ id: ArtworkCategory | "todas"; label: string }> = [
  { id: "todas", label: "Todas as tipologias" },
  { id: "pintura", label: "Pintura" },
  { id: "escultura", label: "Escultura" },
  { id: "gravura", label: "Gravura" },
  { id: "desenho", label: "Desenho" },
  { id: "fotografia", label: "Fotografia" },
  { id: "instalacao", label: "Instalação" },
  { id: "arte_popular", label: "Arte Popular" },
];

const QUICK_ERAS: Array<{ label: string; range: [number, number] }> = [
  { label: "Barroco & Colonial (1640–1810)", range: [1640, 1810] },
  { label: "Missão & Academismo (1810–1910)", range: [1810, 1910] },
  { label: "Modernismo & 1922 (1910–1950)", range: [1910, 1950] },
  { label: "Concretismo & Vanguarda (1950–1980)", range: [1950, 1980] },
  { label: "Arte Contemporânea (1980–2030)", range: [1980, 2030] },
];

const FEATURED_MUSEUM_IDS = [
  "masp",
  "pinacoteca-sp",
  "mnba",
  "inhotim",
  "museu-inconfidencia",
  "castro-maya",
  "ims-rj",
];

export function MegaMenu({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  onRandomArtwork,
  selectedCategory,
  onSelectCategory,
  decadeRange,
  onDecadeRangeChange,
  selectedHex,
  onSelectHex,
  selectedInstitutionId,
  onSelectInstitution,
  selectedRights,
  onSelectRights,
  selectedProvider,
  onSelectProvider,
  onResetAll,
  totalCatalogCount,
  totalArtistsCount,
  hasActiveFilters,
}: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const featuredMuseums = FEATURED_MUSEUM_IDS.map((id) =>
    BRAZILIAN_MUSEUMS.find((m) => m.id === id)
  ).filter((m): m is NonNullable<typeof m> => Boolean(m));

  const navigateAndExplore = (action: () => void) => {
    action();
    if (activeSection !== "explorar") {
      onSelectSection("explorar");
    }
  };

  return (
    <div className="relative z-10">
      {/* Subtle scrim covering viewport below header */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-0 bg-[#111110]/20 backdrop-blur-[1px] transition-opacity duration-200"
      />

      {/* Collapsible Mega Menu Panel */}
      <div
        ref={panelRef}
        id="curatorial-mega-menu"
        role="region"
        aria-label="Menu curatorial do acervo"
        className="relative z-10 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-b border-[#E5E2DC] bg-white shadow-[0_24px_48px_-16px_rgba(17,17,16,0.12)]"
      >
        <div className="mx-auto max-w-[1360px] px-5 py-7 sm:px-8">
          {/* Top Mega Menu Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECEAE4] pb-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#706D67]">
              <span className="font-medium text-[#111110]">
                Índice Curatorial
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {totalCatalogCount} obras
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {totalArtistsCount} artistas
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {BRAZILIAN_MUSEUMS.length} instituições
              </span>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8B3A1E] transition-colors hover:bg-[#F7F6F3] whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Limpar filtros</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Recolher menu"
                className="inline-flex cursor-pointer items-center gap-1.5 border border-[#E5E2DC] px-3 py-1 text-xs font-medium text-[#111110] transition-colors hover:border-[#111110] whitespace-nowrap shrink-0"
              >
                <span>Fechar</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 4-Column Architectural Museum Grid */}
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
            {/* Column 1: Salas & Descoberta */}
            <div className="lg:col-span-3 lg:border-r lg:border-[#ECEAE4] lg:pr-6">
              <p className="font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                01. Salas do Museu
              </p>
              <ul className="mt-3 space-y-1">
                {(
                  [
                    {
                      id: "explorar",
                      title: "Galeria & Busca Semântica",
                      desc: "Pesquisa livre por conceito, luz ou pigmento",
                    },
                    {
                      id: "artistas",
                      title: "Índice de Artistas",
                      desc: `${totalArtistsCount} mestres unificados por QID`,
                    },
                    {
                      id: "movimentos",
                      title: "Movimentos & Linhagens",
                      desc: "Percurso cronológico de 1640 ao presente",
                    },
                    {
                      id: "mapa",
                      title: "Geografia dos Acervos",
                      desc: "Rede de museus e fontes abertas",
                    },
                  ] as Array<{ id: AppSection; title: string; desc: string }>
                ).map((nav) => {
                  const active = activeSection === nav.id;
                  return (
                    <li key={nav.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSection(nav.id);
                          onClose();
                        }}
                        className={`group flex w-full cursor-pointer items-start justify-between gap-2 px-3 py-2 text-left transition-colors ${
                          active
                            ? "bg-[#111110] text-white"
                            : "text-[#111110] hover:bg-[#F5F4F0]"
                        }`}
                      >
                        <div>
                          <span className="block text-sm font-medium">
                            {nav.title}
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] ${
                              active ? "text-[#D8D5CE]" : "text-[#706D67]"
                            }`}
                          >
                            {nav.desc}
                          </span>
                        </div>
                        <ArrowUpRight
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-opacity ${
                            active
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 border-t border-[#ECEAE4] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onRandomArtwork();
                    onClose();
                  }}
                  className="flex w-full cursor-pointer items-center justify-between border border-[#111110] bg-white px-3.5 py-2.5 text-xs font-medium text-[#111110] transition-colors hover:bg-[#111110] hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sortear Obra Aleatória</span>
                  </span>
                  <Compass className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Column 2: Tipologias & Épocas */}
            <div className="lg:col-span-3 lg:border-r lg:border-[#ECEAE4] lg:pr-6">
              <p className="font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                02. Tipologias
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        navigateAndExplore(() => onSelectCategory(cat.id))
                      }
                      className={`cursor-pointer truncate border px-2.5 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? "border-[#111110] bg-[#111110] font-medium text-white"
                          : "border-[#ECEAE4] bg-[#FAFAF8] text-[#2D2C29] hover:border-[#111110]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                Épocas Rápidas
              </p>
              <ul className="mt-2 space-y-1">
                {QUICK_ERAS.map((era) => {
                  const isActive =
                    decadeRange[0] === era.range[0] &&
                    decadeRange[1] === era.range[1];
                  return (
                    <li key={era.label}>
                      <button
                        type="button"
                        onClick={() =>
                          navigateAndExplore(() =>
                            onDecadeRangeChange(
                              isActive ? [1640, 2030] : era.range
                            )
                          )
                        }
                        className={`w-full cursor-pointer px-2.5 py-1 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-[#F2EDE7] font-medium text-[#8B3A1E]"
                            : "text-[#4A4742] hover:bg-[#F5F4F0] hover:text-[#111110]"
                        }`}
                      >
                        {era.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 3: Paleta & Cronologia */}
            <div className="lg:col-span-3 lg:border-r lg:border-[#ECEAE4] lg:pr-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                  03. Pigmento Dominante
                </p>
                {selectedHex && (
                  <button
                    type="button"
                    onClick={() => onSelectHex(null)}
                    className="cursor-pointer font-mono text-[11px] text-[#8B3A1E] underline hover:text-[#111110]"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {CURATED_PIGMENTS.map((pigment) => {
                  const active =
                    selectedHex?.toLowerCase() === pigment.hex.toLowerCase();
                  return (
                    <button
                      key={pigment.hex}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        navigateAndExplore(() =>
                          onSelectHex(active ? null : pigment.hex)
                        )
                      }
                      className={`flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? "border-[#111110] bg-[#111110] text-white"
                          : "border-[#ECEAE4] bg-[#FAFAF8] text-[#111110] hover:border-[#111110]"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 border border-black/15"
                        style={{ backgroundColor: pigment.hex }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{pigment.name}</span>
                    </button>
                  );
                })}
              </div>

              <label className="mt-2.5 flex cursor-pointer items-center justify-between border border-[#ECEAE4] bg-[#FAFAF8] px-3 py-1.5 text-xs text-[#4A4742] hover:border-[#111110]">
                <span>Cor personalizada (CIE Lab)</span>
                <span className="inline-flex items-center gap-2 font-mono text-[11px]">
                  <span>{selectedHex ?? "HEX"}</span>
                  <input
                    type="color"
                    aria-label="Selecionar cor personalizada"
                    value={selectedHex ?? "#8B3A1E"}
                    onChange={(e) =>
                      navigateAndExplore(() =>
                        onSelectHex(e.target.value.toUpperCase())
                      )
                    }
                    className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                  />
                </span>
              </label>

              <div className="mt-5 border-t border-[#ECEAE4] pt-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                    Linha do Tempo
                  </p>
                  <span className="font-mono text-xs font-medium text-[#111110] tabular-nums">
                    {decadeRange[0]} — {decadeRange[1]}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="mega-timeline-start"
                      className="block text-[11px] text-[#706D67]"
                    >
                      De {decadeRange[0]}
                    </label>
                    <input
                      id="mega-timeline-start"
                      type="range"
                      min={1640}
                      max={2030}
                      step={10}
                      value={decadeRange[0]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        navigateAndExplore(() =>
                          onDecadeRangeChange([
                            Math.min(val, decadeRange[1]),
                            decadeRange[1],
                          ])
                        );
                      }}
                      className="timeline-slider mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mega-timeline-end"
                      className="block text-[11px] text-[#706D67]"
                    >
                      Até {decadeRange[1]}
                    </label>
                    <input
                      id="mega-timeline-end"
                      type="range"
                      min={1640}
                      max={2030}
                      step={10}
                      value={decadeRange[1]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        navigateAndExplore(() =>
                          onDecadeRangeChange([
                            decadeRange[0],
                            Math.max(val, decadeRange[0]),
                          ])
                        );
                      }}
                      className="timeline-slider mt-1 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Museus, Fontes & Direitos */}
            <div className="lg:col-span-3">
              <p className="font-mono text-[11px] tracking-wider text-[#706D67] uppercase">
                04. Museus & Proveniência
              </p>
              <ul className="mt-3 space-y-1">
                {featuredMuseums.map((museum) => {
                  const active = selectedInstitutionId === museum.id;
                  return (
                    <li key={museum.id}>
                      <button
                        type="button"
                        onClick={() =>
                          navigateAndExplore(() =>
                            onSelectInstitution(active ? null : museum.id)
                          )
                        }
                        className={`flex w-full cursor-pointer items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "bg-[#111110] font-medium text-white"
                            : "text-[#2D2C29] hover:bg-[#F5F4F0]"
                        }`}
                      >
                        <span className="truncate">{museum.shortName}</span>
                        <span
                          className={`font-mono text-[10px] ${
                            active ? "text-[#D8D5CE]" : "text-[#706D67]"
                          }`}
                        >
                          {museum.state}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-[#ECEAE4] pt-4">
                <div>
                  <label
                    htmlFor="mega-provider-filter"
                    className="block font-mono text-[10px] tracking-wider text-[#706D67] uppercase"
                  >
                    Fonte / Agregador
                  </label>
                  <select
                    id="mega-provider-filter"
                    value={selectedProvider}
                    onChange={(e) =>
                      navigateAndExplore(() =>
                        onSelectProvider(
                          e.target.value as SourceProvider | "todos"
                        )
                      )
                    }
                    className="mt-1 h-8 w-full border border-[#E5E2DC] bg-[#FAFAF8] px-2 text-xs text-[#111110] focus:border-[#111110] focus:outline-none"
                  >
                    <option value="todos">Todas as fontes</option>
                    <option value="tainacan">Tainacan / Ibram</option>
                    <option value="wikidata">Wikidata & Wikimedia GLAM</option>
                    <option value="brasiliana">Brasiliana Iconográfica</option>
                    <option value="institutional_api">
                      Catálogos Institucionais
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mega-rights-filter"
                    className="block font-mono text-[10px] tracking-wider text-[#706D67] uppercase"
                  >
                    Regime de Direitos
                  </label>
                  <select
                    id="mega-rights-filter"
                    value={selectedRights}
                    onChange={(e) =>
                      navigateAndExplore(() =>
                        onSelectRights(e.target.value as RightsStatus | "todos")
                      )
                    }
                    className="mt-1 h-8 w-full border border-[#E5E2DC] bg-[#FAFAF8] px-2 text-xs text-[#111110] focus:border-[#111110] focus:outline-none"
                  >
                    <option value="todos">Todos os regimes</option>
                    <option value="public_domain">Domínio Público</option>
                    <option value="cc_open">Licença Aberta (CC)</option>
                    <option value="copyright_restricted">
                      Referencial (Direitos Vigentes)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
