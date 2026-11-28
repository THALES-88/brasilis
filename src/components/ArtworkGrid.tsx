import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
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

  return (
    <article
      data-testid={`artwork-card-${artwork.id}`}
      className="mb-11 break-inside-avoid"
    >
      <button
        type="button"
        onClick={() => onSelect(artwork)}
        className="group block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111110]"
      >
        <div
          className="relative w-full overflow-hidden border border-[#EAE8E3] bg-[#F3F2EE]"
          style={{ aspectRatio: String(artwork.media.aspect_ratio) }}
        >
          {!imgError ? (
            <img
              src={artwork.media.thumb_url}
              alt={`${artwork.title}, ${artwork.artist.name} (${artwork.chronology.display_date})`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F3F2EE] to-[#E6E4DD] p-6 text-center text-[#706D67]">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
              <span className="font-editorial text-lg text-[#111110]">
                {artwork.title}
              </span>
              <span className="text-xs">{artwork.source.institution}</span>
            </div>
          )}
        </div>

        {/* Clean minimalist museum wall label */}
        <div className="mt-3">
          <h2 className="font-editorial text-xl leading-snug font-medium text-[#111110] transition-colors group-hover:text-[#8B3A1E]">
            {artwork.title}
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-[#706D67]">
            <span className="text-[#2D2C29]">{artwork.artist.name}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-figures">
              {artwork.chronology.display_date}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{artwork.source.institution}</span>
            {hasQueryOrColor && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-figures text-[#8B3A1E]">
                  {Math.round(score * 100)}%
                </span>
              </>
            )}
          </p>
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
      <div className="mx-auto max-w-[1360px] px-5 py-24 text-center sm:px-8">
        <p className="font-editorial text-3xl text-[#111110]">
          Nenhuma obra encontrada para esta combinação.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#706D67]">
          Tente ampliar o recorte histórico, suavizar o filtro de cor ou explorar novos termos na curadoria.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 cursor-pointer border border-[#111110] bg-[#111110] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:border-[#8B3A1E] hover:bg-[#8B3A1E]"
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
      className="mx-auto max-w-[1360px] px-5 py-12 sm:px-8"
    >
      <div className="columns-1 gap-10 sm:columns-2 lg:columns-3">
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EAE8E3] pt-8 sm:flex-row">
          <p className="font-mono text-xs text-[#706D67] tabular-figures">
            Exibindo {visibleResults.length} de {results.length} obras catalogadas
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="cursor-pointer border border-[#111110] bg-[#111110] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:border-[#8B3A1E] hover:bg-[#8B3A1E] whitespace-nowrap shrink-0"
            >
              Carregar mais {Math.min(PAGE_SIZE, remaining)} obras
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(results.length)}
              className="cursor-pointer border border-[#DCDAD3] bg-white px-4 py-2.5 text-xs font-medium text-[#111110] transition-colors hover:border-[#111110] whitespace-nowrap shrink-0"
            >
              Exibir todas ({results.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
