import { useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapPin, ExternalLink, ArrowRight } from "lucide-react";
import { BRAZILIAN_MUSEUMS, OPEN_AGGREGATORS } from "../data/catalog";
import type {
  ArtworkRecord,
  MuseumInstitution,
  SourceProvider,
} from "../types/art";

interface MuseumMapViewProps {
  mapsApiKey: string;
  quotaExceeded: boolean;
  artworks: ArtworkRecord[];
  onFilterByInstitution: (institutionId: string) => void;
  onFilterByProvider?: (provider: SourceProvider) => void;
}

function MuseumMarker({
  museum,
  isSelected,
  artworkCount,
  onSelect,
  onCloseInfoWindow,
  onExploreMuseum,
}: {
  museum: MuseumInstitution;
  isSelected: boolean;
  artworkCount: number;
  onSelect: (museum: MuseumInstitution) => void;
  onCloseInfoWindow: () => void;
  onExploreMuseum: (institutionId: string) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: museum.lat, lng: museum.lng }}
        title={museum.name}
        onClick={() => onSelect(museum)}
      >
        <Pin
          background={isSelected ? "#8B3A1E" : "#141413"}
          borderColor="#F7F6F2"
          glyphColor="#F7F6F2"
          scale={isSelected ? 1.25 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={290}
          onCloseClick={onCloseInfoWindow}
        >
          <div className="p-1 font-sans text-[#141413]">
            <p className="font-mono text-[10px] tracking-wider text-[#8B3A1E] uppercase">
              {museum.city}, {museum.state} · {museum.openPlatform}
            </p>
            <h3 className="font-editorial mt-0.5 text-lg font-semibold leading-tight text-[#141413]">
              {museum.name}
            </h3>
            <p className="mt-1 text-xs leading-snug text-[#4A4742]">
              {museum.collectionFocus}
            </p>
            <p className="mt-1.5 text-[11px] text-[#6E6A63]">
              {museum.address}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E5E0D5] pt-2">
              <button
                type="button"
                onClick={() => onExploreMuseum(museum.id)}
                className="cursor-pointer bg-[#141413] px-2.5 py-1.5 text-[11px] font-medium text-[#F7F6F2] hover:bg-[#8B3A1E] whitespace-nowrap shrink-0"
              >
                {artworkCount > 0
                  ? `Ver ${artworkCount} ${artworkCount === 1 ? "obra" : "obras"} no acervo`
                  : "Ver acervo"}
              </button>
              <a
                href={museum.catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E3A5F] underline"
              >
                <span>Site</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function MuseumMapView({
  mapsApiKey,
  quotaExceeded,
  artworks,
  onFilterByInstitution,
  onFilterByProvider,
}: MuseumMapViewProps) {
  const [selectedMuseum, setSelectedMuseum] =
    useState<MuseumInstitution | null>(BRAZILIAN_MUSEUMS[0]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -18.5,
    lng: -46.5,
  });
  const [mapZoom, setMapZoom] = useState<number>(4);

  const handleSelectMuseum = (museum: MuseumInstitution) => {
    setSelectedMuseum(museum);
    setMapCenter({ lat: museum.lat, lng: museum.lng });
    setMapZoom(12);
  };

  const countByInstitution: Record<string, number> = {};
  for (const art of artworks) {
    countByInstitution[art.source.institution_id] =
      (countByInstitution[art.source.institution_id] ?? 0) + 1;
  }

  return (
    <section
      aria-label="Mapa geográfico de museus e acervos brasileiros"
      className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDD8CE] pb-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-[#6E6A63] uppercase">
            Cartografia Cultural · Rede de {BRAZILIAN_MUSEUMS.length} Instituições Mantenedoras
          </p>
          <h1 className="font-editorial mt-2 text-4xl font-medium text-[#141413]">
            Geografia dos acervos brasileiros.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6A63]">
            Explore onde estão preservadas as coleções indexadas pelo Acervo Brasilis. Selecione um museu no mapa ou na lista ao lado para inspecionar sua sede e filtrar suas obras.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMapCenter({ lat: -18.5, lng: -46.5 });
            setMapZoom(4);
          }}
          className="cursor-pointer self-start border border-[#DDD8CE] bg-white px-4 py-2 text-xs font-medium text-[#141413] hover:border-[#141413] md:self-auto"
        >
          Ver todo o Brasil
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Interactive Museum Directory */}
        <div className="max-h-[580px] divide-y divide-[#DDD8CE] overflow-y-auto border border-[#DDD8CE] bg-white lg:col-span-4">
          {BRAZILIAN_MUSEUMS.map((museum) => {
            const active = selectedMuseum?.id === museum.id;
            const count = countByInstitution[museum.id] ?? 0;

            return (
              <div
                key={museum.id}
                className={`p-4 transition-colors ${
                  active ? "bg-[#EFECE6]" : "bg-white hover:bg-[#FAF8F4]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectMuseum(museum)}
                  className="w-full cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#6E6A63]">
                    <span>
                      {museum.city}, {museum.state}
                    </span>
                    <span className="tabular-figures">
                      {count} {count === 1 ? "obra" : "obras"}
                    </span>
                  </div>
                  <h2 className="font-editorial mt-1 text-xl font-semibold text-[#141413]">
                    {museum.name}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                    {museum.collectionFocus}
                  </p>
                </button>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#6E6A63]">
                    {museum.openPlatform}
                  </span>
                  {count > 0 ? (
                    <button
                      type="button"
                      onClick={() => onFilterByInstitution(museum.id)}
                      className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#8B3A1E] hover:underline"
                    >
                      <span>Filtrar acervo</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  ) : (
                    <a
                      href={museum.catalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#1E3A5F] hover:underline"
                    >
                      <span>Catálogo externo</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Canvas: Google Maps Platform */}
        <div className="lg:col-span-8">
          <div className="relative h-[460px] w-full overflow-hidden border border-[#DDD8CE] bg-[#EFECE6] lg:h-[580px]">
            {mapsApiKey && !quotaExceeded ? (
              <APIProvider
                apiKey={mapsApiKey}
                language="pt-BR"
                region="BR"
                libraries={["marker"]}
              >
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  center={mapCenter}
                  zoom={mapZoom}
                  onCameraChanged={(ev) => {
                    setMapCenter(ev.detail.center);
                    setMapZoom(ev.detail.zoom);
                  }}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={[
                    "gmp_mcp_codeassist_v1_aistudio",
                  ]}
                  style={{ width: "100%", height: "100%" }}
                >
                  {BRAZILIAN_MUSEUMS.map((museum) => (
                    <MuseumMarker
                      key={museum.id}
                      museum={museum}
                      isSelected={selectedMuseum?.id === museum.id}
                      artworkCount={countByInstitution[museum.id] ?? 0}
                      onSelect={handleSelectMuseum}
                      onCloseInfoWindow={() => setSelectedMuseum(null)}
                      onExploreMuseum={onFilterByInstitution}
                    />
                  ))}
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <MapPin
                  className="h-8 w-8 text-[#8B3A1E]"
                  aria-hidden="true"
                />
                <h3 className="font-editorial mt-3 text-2xl font-medium text-[#141413]">
                  {selectedMuseum
                    ? `${selectedMuseum.name} — ${selectedMuseum.city}, ${selectedMuseum.state}`
                    : "Mapa de Museus Brasileiros"}
                </h3>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-[#6E6A63]">
                  {selectedMuseum?.address}
                </p>
                <p className="mt-3 font-mono text-[11px] text-[#6E6A63]">
                  {selectedMuseum
                    ? `Coordenadas: ${selectedMuseum.lat.toFixed(4)}, ${selectedMuseum.lng.toFixed(4)}`
                    : ""}
                </p>
                {!mapsApiKey && (
                  <p className="mt-4 max-w-md border border-[#D6CEBE] bg-white px-4 py-2.5 text-xs text-[#57534E]">
                    Configure a variável{" "}
                    <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code>{" "}
                    no painel de segredos para carregar os blocos interativos do Google Maps.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Open Aggregators & Reference Ecosystem */}
      <div className="mt-12 border-t border-[#DDD8CE] pt-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-[#6E6A63] uppercase">
            Infraestrutura de Dados Abertos
          </p>
          <h2 className="font-editorial mt-1.5 text-2xl font-medium text-[#141413]">
            Agregadores, APIs estruturadas e bases de referência.
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[#6E6A63]">
            Indexação orientada por padrões Dublin Core / INBCM, API REST Tainacan, consultas SPARQL no Wikidata GLAM Brasil e separação jurídica entre índice semântico e acervo detentor.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OPEN_AGGREGATORS.map((agg) => (
            <article
              key={agg.id}
              className="flex flex-col justify-between border border-[#DDD8CE] bg-white p-4"
            >
              <div>
                <p className="font-mono text-[10px] tracking-wider text-[#8B3A1E] uppercase">
                  {agg.kind === "api_aberta"
                    ? "API / Dados Abertos"
                    : agg.kind === "glam_sparql"
                      ? "SPARQL & QID Canônico"
                      : "Base de Referência"}
                </p>
                <h3 className="font-editorial mt-1 text-lg font-semibold text-[#141413]">
                  {agg.name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#57534E]">
                  {agg.role}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFECE6] pt-3 text-xs">
                {agg.providerKey && onFilterByProvider ? (
                  <button
                    type="button"
                    onClick={() => onFilterByProvider(agg.providerKey!)}
                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#141413] hover:text-[#8B3A1E]"
                  >
                    <span>Filtrar fonte</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-[#6E6A63]">
                    Referência externa
                  </span>
                )}
                <a
                  href={agg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#1E3A5F] hover:underline"
                >
                  <span>Portal</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
