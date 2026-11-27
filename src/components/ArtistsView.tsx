import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import {
  filterArtistEntities,
  getItauEncyclopediaSearchUrl,
  groupArtistsByEntity,
} from "../lib/artist-entities";
import type { ArtworkRecord } from "../types/art";

interface ArtistsViewProps {
  artworks: ArtworkRecord[];
  onSelectArtist: (artistName: string, artistQid?: string | null) => void;
  onSelectArtwork: (artwork: ArtworkRecord) => void;
}

export function ArtistsView({
  artworks,
  onSelectArtist,
  onSelectArtwork,
}: ArtistsViewProps) {
  const [filterText, setFilterText] = useState("");

  const artistGroups = useMemo(
    () => groupArtistsByEntity(artworks),
    [artworks]
  );

  const filteredArtists = useMemo(
    () => filterArtistEntities(artistGroups, filterText),
    [artistGroups, filterText]
  );

  return (
    <section className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8">
      <div className="flex flex-col justify-between gap-6 border-b border-[#DDD8CE] pb-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-[#6E6A63] uppercase">
            Índice Onomástico · {artistGroups.length} Artistas Catalogados
          </p>
          <h1 className="font-editorial mt-2 text-4xl font-medium text-[#141413]">
            Mestres, criadores e tradições representadas no acervo.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6A63]">
            Da pintura holandesa seiscentista e imaginária barroca ao academismo, modernismo, abstração construtiva e fotografia documental. Selecione qualquer artista para filtrar suas obras no buscador.
          </p>
        </div>

        <div className="w-full md:w-80">
          <label htmlFor="artists-filter-input" className="sr-only">
            Filtrar artista, QID, movimento ou museu
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6E6A63]"
              aria-hidden="true"
            />
            <input
              id="artists-filter-input"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar artista, QID, estado ou movimento..."
              className="h-10 w-full border border-[#C8C2B6] bg-white pr-3 pl-9 text-xs text-[#141413] placeholder:text-[#8A857C] focus:border-[#141413] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArtists.map((group) => {
          const lead = group.works[0];
          const lifespan = group.birth_year
            ? `${group.birth_year}–${group.death_year ?? "atual"}`
            : "Período histórico";

          return (
            <article
              key={group.entityKey}
              className="flex flex-col justify-between border border-[#DDD8CE] bg-white p-5"
            >
              <div>
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => onSelectArtwork(lead)}
                    className="h-20 w-20 shrink-0 cursor-pointer overflow-hidden border border-[#DDD8CE] bg-[#EFECE6]"
                    aria-label={`Visualizar obra ${lead.title}`}
                  >
                    <img
                      src={lead.media.thumb_url}
                      alt={lead.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-[#6E6A63] tabular-figures">
                      {lifespan}
                      {group.origin_state ? ` · ${group.origin_state}` : ""}
                      {" · "}
                      {group.works.length}{" "}
                      {group.works.length === 1 ? "obra" : "obras"}
                      {group.wikidata_qid ? ` · ${group.wikidata_qid}` : ""}
                    </p>
                    <h2 className="font-editorial mt-1 text-xl leading-snug font-semibold text-[#141413]">
                      {group.canonicalName}
                    </h2>
                    <p className="mt-1 text-xs text-[#8B3A1E]">
                      {group.movements[0]}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#4A4742] line-clamp-3">
                  {group.bio_pt}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#EFECE6] pt-3.5 text-xs">
                <div className="flex min-w-0 items-center gap-2 text-[#6E6A63]">
                  <span className="truncate">
                    {group.institutions.length > 1
                      ? `${group.institutions[0]} (+${group.institutions.length - 1})`
                      : group.institutions[0]}
                  </span>
                  <a
                    href={getItauEncyclopediaSearchUrl(group.canonicalName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Consultar biografia na Enciclopédia Itaú Cultural"
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-[#1E3A5F] hover:underline"
                  >
                    <span>Itaú</span>
                    <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSelectArtist(group.canonicalName, group.wikidata_qid)
                  }
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#141413] hover:text-[#8B3A1E] whitespace-nowrap shrink-0"
                >
                  <span>
                    Explorar {group.works.length === 1 ? "obra" : `${group.works.length} obras`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
