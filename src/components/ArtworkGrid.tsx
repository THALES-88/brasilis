import { useEffect, useState } from "react";
import { ImageOff, ArrowUpRight } from "lucide-react";
import type { SearchResult } from "../lib/hybrid-search";
import type { ArtworkRecord } from "../types/art";

interface ArtworkGridProps {
  results: SearchResult[];
  hasQueryOrColor: boolean;
  onSelectArtwork: (artwork: ArtworkRecord) => void;
  onResetFilters: () => void;
}

const PAGE_SIZE = 36;

function ArtworkCard({
  result,
  hasQueryOrColor,
  onSelect,
}: {
  result: SearchResult;
  hasQueryOrColor: boolean;
  onSelect: (artwork: ArtworkRecord) => void;
}) {
  const { artwork, score } = result;
  const [imgError, setImgError] = useState(false);

  const rightsLabel =
    artwork.rights.status === "public_domain"
      ? "Domínio Público"
      : artwork.rights.status === "cc_open"
        ? "Licença Aberta"
        : "Direitos Reservados";

  return (
    <article
      data-testid={`artwork-card-${artwork.id}`}
      className="mb-9 break-inside-avoid"
    >
      <button
        type="button"
        onClick={() => onSelect(artwork)}
        className="group block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141413]"
      >
        <div
          className="relative w-full overflow-hidden border border-[#DDD8CE] bg-[#EFECE6]"
          style={{ aspectRatio: String(artwork.media.aspect_ratio) }}
        >
          {!imgError ? (
            <img
              src={artwork.media.thumb_url}
              alt={`${artwork.title}, ${artwork.artist.name} (${artwork.chronology.display_date})`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#EFECE6] to-[#E2DDD2] p-6 text-center text-[#6E6A63]">
              <ImageOff className="h-6 w-6" aria-hidden="true" />
              <span className="font-editorial text-lg text-[#141413]">
                {artwork.title}
              </span>
              <span className="text-xs">{artwork.source.institution}</span>
            </div>
          )}
        </div>

        {/* Zero-pill unboxed metadata below plate */}
        <div className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-editorial text-xl leading-snug font-semibold text-[#141413] group-hover:text-[#8B3A1E] transition-colors">
              {artwork.title}
            </h2>
            <ArrowUpRight
              className="mt-1 h-4 w-4 shrink-0 text-[#6E6A63] opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>

          <p className="mt-1 text-sm text-[#4A4742]">
            {artwork.artist.name}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6E6A63]">
            <span className="font-mono tabular-figures">
              {artwork.chronology.display_date}
            </span>
            <span aria-hidden="true">·</span>
            <span>{artwork.source.institution}</span>
            <span aria-hidden="true">·</span>
            <span>{rightsLabel}</span>
            {hasQueryOrColor && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-figures text-[#8B3A1E]">
                  {Math.round(score * 100)}% afinidade
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}

export function ArtworkGrid({
  results,
  hasQueryOrColor,
  onSelectArtwork,
  onResetFilters,
}: ArtworkGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-[1360px] px-5 py-20 text-center sm:px-8">
        <p className="font-editorial text-3xl text-[#141413]">
          Nenhuma obra encontrada para esta combinação.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6E6A63]">
          Tente ampliar o recorte histórico, suavizar o filtro de cor ou usar termos mais amplos de atmosfera e técnica.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 cursor-pointer border border-[#141413] bg-[#141413] px-5 py-2.5 text-xs font-medium text-[#F7F6F2] hover:bg-[#8B3A1E] hover:border-[#8B3A1E]"
        >
          Restaurar todo o acervo
        </button>
      </div>
    );
  }

  const visibleResults = results.slice(0, visibleCount);
  const remaining = Math.max(0, results.length - visibleResults.length);

  return (
    <div
      data-testid="artwork-grid"
      className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8"
    >
      <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
        {visibleResults.map((res) => (
          <ArtworkCard
            key={res.artwork.id}
            result={res}
            hasQueryOrColor={hasQueryOrColor}
            onSelect={onSelectArtwork}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#DDD8CE] pt-8 sm:flex-row">
          <p className="font-mono text-xs text-[#6E6A63] tabular-figures">
            Exibindo {visibleResults.length} de {results.length} obras catalogadas
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="cursor-pointer border border-[#141413] bg-[#141413] px-5 py-2.5 text-xs font-medium text-[#F7F6F2] transition-colors hover:border-[#8B3A1E] hover:bg-[#8B3A1E] whitespace-nowrap shrink-0"
            >
              Carregar mais {Math.min(PAGE_SIZE, remaining)} obras
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(results.length)}
              className="cursor-pointer border border-[#C8C2B6] bg-white px-4 py-2.5 text-xs font-medium text-[#141413] transition-colors hover:border-[#141413] whitespace-nowrap shrink-0"
            >
              Exibir todas ({results.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
