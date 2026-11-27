import { ArrowRight } from "lucide-react";
import { MOVEMENT_ERAS } from "../data/catalog";
import type { ArtworkRecord } from "../types/art";

interface MovementsViewProps {
  artworks: ArtworkRecord[];
  onExploreDecadeRange: (range: [number, number]) => void;
  onSelectArtwork: (artwork: ArtworkRecord) => void;
}

export function MovementsView({
  artworks,
  onExploreDecadeRange,
  onSelectArtwork,
}: MovementsViewProps) {
  return (
    <section className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8">
      <div className="max-w-2xl border-b border-[#DDD8CE] pb-6">
        <p className="font-mono text-xs tracking-widest text-[#6E6A63] uppercase">
          Curadoria Cronológica · Panorama Brasileiro
        </p>
        <h1 className="font-editorial mt-2 text-4xl font-medium text-[#141413]">
          Movimentos e linhagens da arte no Brasil.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6A63]">
          Navegue pelos grandes ciclos visuais da produção brasileira e abra cada período diretamente na linha do tempo do buscador.
        </p>
      </div>

      <div className="mt-8 divide-y divide-[#DDD8CE] border-b border-[#DDD8CE]">
        {MOVEMENT_ERAS.map((era, index) => {
          const featured =
            artworks.find((a) => a.id === era.featuredArtworkId) ?? artworks[0];
          const eraWorks = artworks.filter((a) => {
            const yr = a.chronology.year_start ?? 0;
            return yr >= era.decadeRange[0] && yr <= era.decadeRange[1];
          });

          return (
            <article
              key={era.id}
              className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3 font-mono text-xs text-[#6E6A63] tabular-figures">
                  <span>{String(index + 1).padStart(2, "0")}.</span>
                  <span aria-hidden="true">·</span>
                  <span>{era.period}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {eraWorks.length}{" "}
                    {eraWorks.length === 1 ? "obra" : "obras"}
                  </span>
                </div>

                <h2 className="font-editorial mt-2 text-3xl font-medium text-[#141413]">
                  {era.name}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4742]">
                  {era.summary}
                </p>

                <p className="mt-3 text-xs text-[#6E6A63]">
                  Traços recorrentes:{" "}
                  <span className="text-[#141413]">
                    {era.keyCharacteristics.join(" · ")}
                  </span>
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => onExploreDecadeRange(era.decadeRange)}
                    className="inline-flex cursor-pointer items-center gap-2 border border-[#141413] bg-[#141413] px-4 py-2 text-xs font-medium text-[#F7F6F2] transition-colors hover:bg-[#8B3A1E] hover:border-[#8B3A1E]"
                  >
                    <span>Explorar período no acervo</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {featured && (
                <div className="lg:col-span-5">
                  <button
                    type="button"
                    onClick={() => onSelectArtwork(featured)}
                    className="group block w-full cursor-pointer text-left"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden border border-[#DDD8CE] bg-[#EFECE6]">
                      <img
                        src={featured.media.thumb_url}
                        alt={featured.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#6E6A63]">
                      Obra de referência:{" "}
                      <span className="font-medium text-[#141413]">
                        {featured.title}
                      </span>{" "}
                      ({featured.chronology.display_date})
                    </p>
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
