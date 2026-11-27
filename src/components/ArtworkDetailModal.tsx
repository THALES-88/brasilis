import { useEffect, useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  MapPin,
  FileDown,
} from "lucide-react";
import {
  getItauEncyclopediaSearchUrl,
  getProviderLabel,
} from "../lib/artist-entities";
import { exportArtworkToPdf } from "../lib/pdf-export";
import type { SearchResult } from "../lib/hybrid-search";
import type { ArtworkRecord } from "../types/art";

interface ArtworkDetailModalProps {
  artwork: ArtworkRecord | null;
  similarWorks: SearchResult[];
  onClose: () => void;
  onSelectArtwork: (artwork: ArtworkRecord) => void;
  onSearchByColor: (hex: string) => void;
  onFilterByArtist: (artistName: string, artistQid?: string | null) => void;
  onFilterByInstitution: (institutionId: string) => void;
}

export function ArtworkDetailModal({
  artwork,
  similarWorks,
  onClose,
  onSelectArtwork,
  onSearchByColor,
  onFilterByArtist,
  onFilterByInstitution,
}: ArtworkDetailModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    setZoomed(false);
    setIsExportingPdf(false);
  }, [artwork?.id]);

  useEffect(() => {
    if (!artwork) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [artwork, onClose]);

  if (!artwork) return null;

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportArtworkToPdf(artwork);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const dimensionsText =
    artwork.classification.dimensions_cm.height &&
    artwork.classification.dimensions_cm.width
      ? `${artwork.classification.dimensions_cm.height} × ${artwork.classification.dimensions_cm.width}${
          artwork.classification.dimensions_cm.depth
            ? ` × ${artwork.classification.dimensions_cm.depth}`
            : ""
        } cm`
      : "Não informadas";

  const rightsTitle =
    artwork.rights.status === "public_domain"
      ? "Domínio Público"
      : artwork.rights.status === "cc_open"
        ? `Licença Aberta (${artwork.rights.license_code ?? "CC"})`
        : "Obra Referencial (Direitos Vigentes)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-artwork-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#141413]/75 p-3 sm:p-6 lg:p-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto w-full max-w-[1160px] border border-[#DDD8CE] bg-[#F7F6F2] text-[#141413] shadow-2xl">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DDD8CE] px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 font-mono text-xs text-[#6E6A63]">
            <span className="shrink-0">{artwork.source.inventory_code ?? artwork.id}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden truncate sm:inline">{artwork.source.institution}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              aria-label="Exportar ficha técnica em PDF"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 border border-[#141413] bg-[#141413] px-3.5 text-xs font-medium text-[#F7F6F2] transition-colors hover:border-[#8B3A1E] hover:bg-[#8B3A1E] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isExportingPdf ? "Gerando PDF..." : "Exportar ficha (PDF)"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar ficha da obra"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-[#DDD8CE] bg-white text-[#141413] transition-colors hover:border-[#141413] hover:bg-[#141413] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Accession Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Museum Plate Viewer */}
          <div className="flex flex-col items-center justify-center border-b border-[#DDD8CE] bg-[#EFECE6] p-6 sm:p-10 lg:col-span-7 lg:border-r lg:border-b-0">
            <div className="relative max-h-[68vh] w-full overflow-hidden border border-[#DDD8CE] bg-[#E5E0D5]">
              <img
                src={
                  artwork.rights.allow_full_display
                    ? (artwork.media.full_url ?? artwork.media.thumb_url)
                    : artwork.media.thumb_url
                }
                alt={`${artwork.title} — ${artwork.artist.name}`}
                referrerPolicy="no-referrer"
                onClick={() => {
                  if (artwork.rights.allow_full_display) {
                    setZoomed((z) => !z);
                  }
                }}
                className={`mx-auto max-h-[65vh] w-full object-contain transition-transform duration-300 ease-out ${
                  artwork.rights.allow_full_display
                    ? zoomed
                      ? "scale-150 cursor-zoom-out"
                      : "scale-100 cursor-zoom-in"
                    : "scale-100 cursor-default"
                }`}
              />
            </div>

            <div className="mt-4 flex w-full items-center justify-between gap-4 text-xs text-[#6E6A63]">
              <span className="leading-relaxed">{artwork.rights.notice_pt}</span>
              {artwork.rights.allow_full_display ? (
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="inline-flex cursor-pointer items-center gap-1.5 border border-[#C8C2B6] bg-white px-3 py-1.5 font-medium text-[#141413] hover:border-[#141413] whitespace-nowrap shrink-0"
                >
                  {zoomed ? (
                    <>
                      <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reduzir</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ampliar detalhe</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="border border-[#D6CEBE] bg-white px-2.5 py-1 font-mono text-[11px] text-[#8B3A1E] whitespace-nowrap shrink-0">
                  Miniatura referencial
                </span>
              )}
            </div>
          </div>

          {/* Right: Curatorial Description & Metadata */}
          <div className="p-6 sm:p-8 lg:col-span-5">
            <p className="font-mono text-xs tracking-widest text-[#8B3A1E] uppercase">
              {artwork.classification.movements.join(" · ")}
            </p>
            <h2
              id="modal-artwork-title"
              className="font-editorial mt-2 text-3xl leading-tight font-semibold text-[#141413]"
            >
              {artwork.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-[#4A4742]">
              <button
                type="button"
                onClick={() =>
                  onFilterByArtist(
                    artwork.artist.name,
                    artwork.artist.wikidata_qid
                  )
                }
                className="cursor-pointer font-medium text-[#141413] underline decoration-[#C8C2B6] underline-offset-4 hover:text-[#8B3A1E]"
              >
                {artwork.artist.name}
              </button>
              {artwork.artist.origin_state && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{artwork.artist.origin_state}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-figures">
                {artwork.chronology.display_date}
              </span>
            </div>

            {/* Visual Caption */}
            <div className="mt-6 border-t border-[#DDD8CE] pt-5">
              <h3 className="text-xs font-semibold tracking-wider text-[#6E6A63] uppercase">
                Leitura Visual & Atmosfera
              </h3>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#2D2B28]">
                {artwork.semantic.visual_caption_pt}
              </p>
              <p className="mt-3 text-xs text-[#6E6A63]">
                Atmosfera:{" "}
                <span className="text-[#141413]">
                  {artwork.semantic.mood.join(" · ")}
                </span>
              </p>
            </div>

            {/* Clickable Dominant Palette */}
            <div className="mt-6 border-t border-[#DDD8CE] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-[#6E6A63] uppercase">
                  Paleta Cromática Dominante
                </h3>
                <span className="text-[11px] text-[#6E6A63]">
                  Clique para buscar por cor
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {artwork.media.dominant_colors.map((hex, idx) => (
                  <button
                    key={`${hex}-${idx}`}
                    type="button"
                    onClick={() => onSearchByColor(hex)}
                    className="group cursor-pointer border border-[#DDD8CE] bg-white p-1.5 text-left transition-colors hover:border-[#141413]"
                  >
                    <div
                      className="h-7 w-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="mt-1.5 block font-mono text-[11px] text-[#4A4742] group-hover:text-[#141413]">
                      {hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accession Definition List */}
            <dl className="mt-6 divide-y divide-[#DDD8CE] border-t border-b border-[#DDD8CE] text-xs">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6E6A63]">Técnica</dt>
                <dd className="text-right font-medium text-[#141413]">
                  {artwork.classification.medium}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6E6A63]">Dimensões</dt>
                <dd className="font-mono tabular-figures text-right text-[#141413]">
                  {dimensionsText}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6E6A63]">Instituição</dt>
                <dd className="text-right">
                  <button
                    type="button"
                    onClick={() =>
                      onFilterByInstitution(artwork.source.institution_id)
                    }
                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#141413] underline decoration-[#C8C2B6] underline-offset-2 hover:text-[#8B3A1E]"
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>{artwork.source.institution}</span>
                  </button>
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6E6A63]">Proveniência</dt>
                <dd className="text-right font-medium text-[#141413]">
                  {getProviderLabel(artwork.source.provider)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6E6A63]">Direitos</dt>
                <dd className="text-right font-medium text-[#141413]">
                  {rightsTitle}
                </dd>
              </div>
              {(artwork.wikidata_qid || artwork.artist.wikidata_qid) && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[#6E6A63]">Identificadores Wikidata</dt>
                  <dd className="flex flex-wrap justify-end gap-2 font-mono text-[11px]">
                    {artwork.wikidata_qid && (
                      <a
                        href={`https://www.wikidata.org/wiki/${artwork.wikidata_qid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E3A5F] underline hover:text-[#8B3A1E]"
                      >
                        Obra {artwork.wikidata_qid}
                      </a>
                    )}
                    {artwork.artist.wikidata_qid && (
                      <a
                        href={`https://www.wikidata.org/wiki/${artwork.artist.wikidata_qid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1E3A5F] underline hover:text-[#8B3A1E]"
                      >
                        Artista {artwork.artist.wikidata_qid}
                      </a>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={artwork.source.record_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 border border-[#141413] bg-[#141413] px-4 py-2.5 text-xs font-medium text-[#F7F6F2] transition-colors hover:bg-[#8B3A1E] hover:border-[#8B3A1E]"
              >
                <span>
                  {artwork.rights.allow_full_display
                    ? "Consultar acervo oficial na instituição"
                    : "Acessar ficha oficial na instituição detentora"}
                </span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={getItauEncyclopediaSearchUrl(artwork.artist.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 border border-[#DDD8CE] bg-white px-4 py-2 text-xs font-medium text-[#141413] transition-colors hover:border-[#141413]"
              >
                <span>Contexto biográfico na Enciclopédia Itaú Cultural</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Proximity Discovery Rail (4 Similar Works) */}
        <div className="border-t border-[#DDD8CE] bg-[#EFECE6] px-6 py-7 sm:px-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-editorial text-2xl font-medium text-[#141413]">
              Proximidade Semântica & Visual
            </h3>
            <span className="text-xs text-[#6E6A63]">
              Deslize por obras afins no espaço vetorial e cromático
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similarWorks.map(({ artwork: sim, score }) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => onSelectArtwork(sim)}
                className="group cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141413]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden border border-[#DDD8CE] bg-white">
                  <img
                    src={sim.media.thumb_url}
                    alt={sim.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="font-editorial mt-2 line-clamp-1 text-base font-semibold text-[#141413] group-hover:text-[#8B3A1E]">
                  {sim.title}
                </p>
                <p className="mt-0.5 text-xs text-[#6E6A63]">
                  <span className="font-mono tabular-figures">
                    {sim.chronology.display_date}
                  </span>{" "}
                  ·{" "}
                  <span className="font-mono tabular-figures text-[#8B3A1E]">
                    {Math.round(score * 100)}%
                  </span>
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
