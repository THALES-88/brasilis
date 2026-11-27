import { useEffect, useMemo, useState } from "react";
import { ARTWORKS_CATALOG, BRAZILIAN_MUSEUMS } from "./data/catalog";
import { BrazilianArtSearchEngine } from "./lib/hybrid-search";
import { Header, type AppSection } from "./components/Header";
import { SearchControls } from "./components/SearchControls";
import { ArtworkGrid } from "./components/ArtworkGrid";
import { ArtworkDetailModal } from "./components/ArtworkDetailModal";
import { ArtistsView } from "./components/ArtistsView";
import { MovementsView } from "./components/MovementsView";
import { MuseumMapView } from "./components/MuseumMapView";
import type {
  ArtworkCategory,
  ArtworkRecord,
  RightsStatus,
  SourceProvider,
} from "./types/art";

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("explorar");
  const [queryInput, setQueryInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [serverSemanticScores, setServerSemanticScores] = useState<
    Record<string, number> | undefined
  >(undefined);
  const [isSearchingVector, setIsSearchingVector] = useState(false);
  const [searchModeLabel, setSearchModeLabel] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [decadeRange, setDecadeRange] = useState<[number, number]>([1640, 2030]);
  const [selectedCategory, setSelectedCategory] = useState<
    ArtworkCategory | "todas"
  >("todas");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<
    string | null
  >(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(
    null
  );
  const [selectedArtistQid, setSelectedArtistQid] = useState<string | null>(
    null
  );
  const [selectedRights, setSelectedRights] = useState<RightsStatus | "todos">(
    "todos"
  );
  const [selectedProvider, setSelectedProvider] = useState<
    SourceProvider | "todos"
  >("todos");

  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkRecord | null>(
    null
  );

  // Google Maps Platform key + Demo Key quota banner state
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", onQuotaExceeded);
    return () =>
      window.removeEventListener("gmp-quota-exceeded", onQuotaExceeded);
  }, []);

  useEffect(() => {
    if (mapsApiKey) return;
    let active = true;
    fetch("./api/maps-config")
      .then((res) => {
        const ct = res.headers.get("content-type") ?? "";
        return res.ok && ct.includes("application/json") ? res.json() : null;
      })
      .then((data) => {
        if (active && data?.apiKey) {
          setMapsApiKey(data.apiKey);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mapsApiKey]);

  const searchEngine = useMemo(
    () => new BrazilianArtSearchEngine(ARTWORKS_CATALOG),
    []
  );

  const handleSubmitQuery = async (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : queryInput).trim();
    setSubmittedQuery(q);
    setApiWarning(null);

    if (!q) {
      setServerSemanticScores(undefined);
      setSearchModeLabel(null);
      return;
    }

    setIsSearchingVector(true);
    try {
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (response.ok) {
        const data = await response.json();
        setServerSemanticScores(data.scores);
        setSearchModeLabel("Embeddings Gemini");
      } else {
        const errData = await response.json().catch(() => null);
        setServerSemanticScores(undefined);
        setSearchModeLabel("Índice Semântico Local");
        if (errData?.code === "MISSING_API_KEY") {
          setApiWarning(
            "Chave Gemini ausente no servidor: utilizando projeção semântica local e correspondência cromática CIE Lab."
          );
        } else if (errData?.error) {
          setApiWarning(
            `Vetorização externa indisponível (${errData.error}). Exibindo resultados pelo índice semântico local.`
          );
        }
      }
    } catch {
      setServerSemanticScores(undefined);
      setSearchModeLabel("Índice Semântico Local");
    } finally {
      setIsSearchingVector(false);
    }
  };

  const results = useMemo(() => {
    return searchEngine.search({
      queryText: submittedQuery || queryInput,
      semanticScores: submittedQuery ? serverSemanticScores : undefined,
      targetHex: selectedHex ?? undefined,
      decadeRange,
      category: selectedCategory,
      institutionId: selectedInstitutionId ?? undefined,
      artistName: selectedArtistName ?? undefined,
      artistQid: selectedArtistQid ?? undefined,
      rightsStatus: selectedRights,
      sourceProvider: selectedProvider,
      limit: 600,
    });
  }, [
    searchEngine,
    submittedQuery,
    queryInput,
    serverSemanticScores,
    selectedHex,
    decadeRange,
    selectedCategory,
    selectedInstitutionId,
    selectedArtistName,
    selectedArtistQid,
    selectedRights,
    selectedProvider,
  ]);

  const similarWorks = useMemo(() => {
    if (!selectedArtwork) return [];
    return searchEngine.findSimilar(selectedArtwork.id, 4);
  }, [searchEngine, selectedArtwork]);

  const selectedInstitutionName = useMemo(() => {
    if (!selectedInstitutionId) return null;
    return (
      BRAZILIAN_MUSEUMS.find((m) => m.id === selectedInstitutionId)?.shortName ??
      selectedInstitutionId
    );
  }, [selectedInstitutionId]);

  const handleResetAll = () => {
    setQueryInput("");
    setSubmittedQuery("");
    setServerSemanticScores(undefined);
    setSearchModeLabel(null);
    setApiWarning(null);
    setSelectedHex(null);
    setDecadeRange([1640, 2030]);
    setSelectedCategory("todas");
    setSelectedInstitutionId(null);
    setSelectedArtistName(null);
    setSelectedArtistQid(null);
    setSelectedRights("todos");
    setSelectedProvider("todos");
  };

  const handleRandomArtwork = () => {
    const pool = results.length > 0 ? results.map((r) => r.artwork) : ARTWORKS_CATALOG;
    const candidates = pool.filter((a) => a.id !== selectedArtwork?.id);
    const pick =
      candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
    if (pick) setSelectedArtwork(pick);
  };

  const handleSearchByColor = (hex: string) => {
    setSelectedHex(hex);
    setSelectedArtwork(null);
    setActiveSection("explorar");
  };

  const handleFilterByArtist = (artistName: string, artistQid?: string | null) => {
    setSelectedArtistName(artistName);
    setSelectedArtistQid(artistQid ?? null);
    setSelectedArtwork(null);
    setActiveSection("explorar");
  };

  const handleFilterByInstitution = (institutionId: string) => {
    setSelectedInstitutionId(institutionId);
    setSelectedArtwork(null);
    setActiveSection("explorar");
  };

  const handleExploreDecadeRange = (range: [number, number]) => {
    setDecadeRange(range);
    setActiveSection("explorar");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F2] text-[#141413]">
      {quotaExceeded && (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 shadow-sm md:text-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-950 underline hover:text-amber-800"
            >
              maps developer site
            </a>{" "}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onRandomArtwork={handleRandomArtwork}
      />

      <main className="flex-1">
        {activeSection === "explorar" && (
          <>
            <SearchControls
              queryInput={queryInput}
              onQueryInputChange={(val) => {
                setQueryInput(val);
                if (!val.trim()) {
                  setSubmittedQuery("");
                  setServerSemanticScores(undefined);
                  setSearchModeLabel(null);
                }
              }}
              onSubmitQuery={handleSubmitQuery}
              selectedHex={selectedHex}
              onSelectHex={setSelectedHex}
              decadeRange={decadeRange}
              onDecadeRangeChange={setDecadeRange}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedInstitutionName={selectedInstitutionName}
              onClearInstitution={() => setSelectedInstitutionId(null)}
              selectedArtistName={selectedArtistName}
              selectedArtistQid={selectedArtistQid}
              onClearArtist={() => {
                setSelectedArtistName(null);
                setSelectedArtistQid(null);
              }}
              selectedRights={selectedRights}
              onSelectRights={setSelectedRights}
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              onResetAll={handleResetAll}
              isSearchingVector={isSearchingVector}
              searchModeLabel={searchModeLabel}
              totalResults={results.length}
              apiWarning={apiWarning}
            />

            <ArtworkGrid
              results={results}
              hasQueryOrColor={Boolean(
                (submittedQuery || queryInput).trim() || selectedHex
              )}
              onSelectArtwork={setSelectedArtwork}
              onResetFilters={handleResetAll}
            />
          </>
        )}

        {activeSection === "artistas" && (
          <ArtistsView
            artworks={ARTWORKS_CATALOG}
            onSelectArtist={handleFilterByArtist}
            onSelectArtwork={setSelectedArtwork}
          />
        )}

        {activeSection === "movimentos" && (
          <MovementsView
            artworks={ARTWORKS_CATALOG}
            onExploreDecadeRange={handleExploreDecadeRange}
            onSelectArtwork={setSelectedArtwork}
          />
        )}

        {activeSection === "mapa" && (
          <MuseumMapView
            mapsApiKey={mapsApiKey}
            quotaExceeded={quotaExceeded}
            artworks={ARTWORKS_CATALOG}
            onFilterByInstitution={handleFilterByInstitution}
            onFilterByProvider={(provider) => {
              setSelectedProvider(provider);
              setActiveSection("explorar");
            }}
          />
        )}
      </main>

      <ArtworkDetailModal
        artwork={selectedArtwork}
        similarWorks={similarWorks}
        onClose={() => setSelectedArtwork(null)}
        onSelectArtwork={setSelectedArtwork}
        onSearchByColor={handleSearchByColor}
        onFilterByArtist={handleFilterByArtist}
        onFilterByInstitution={handleFilterByInstitution}
      />

      <footer className="border-t border-[#DDD8CE] bg-[#EFECE6] py-8 text-xs text-[#6E6A63]">
        <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-8">
          <div>
            <span className="font-editorial text-base font-semibold text-[#141413]">
              Acervo Brasilis
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              Camada de descoberta semântica para acervos públicos brasileiros (Lei nº 9.610/98).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection("explorar")}
              className="cursor-pointer hover:text-[#141413] hover:underline"
            >
              Explorar Acervo
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("movimentos")}
              className="cursor-pointer hover:text-[#141413] hover:underline"
            >
              Linha do Tempo
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("mapa")}
              className="cursor-pointer hover:text-[#141413] hover:underline"
            >
              Rede de Museus
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
