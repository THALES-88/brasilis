import { Shuffle } from "lucide-react";

export type AppSection = "explorar" | "artistas" | "movimentos" | "mapa";

interface HeaderProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onRandomArtwork: () => void;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: "explorar", label: "Explorar" },
  { id: "artistas", label: "Artistas" },
  { id: "movimentos", label: "Movimentos" },
  { id: "mapa", label: "Mapa" },
];

export function Header({
  activeSection,
  onSelectSection,
  onRandomArtwork,
}: HeaderProps) {
  return (
    <header className="border-b border-[#DDD8CE] bg-[#F7F6F2]">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3.5 sm:gap-8 sm:px-8 sm:py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection("explorar")}
          className="font-editorial cursor-pointer text-left text-xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0 sm:text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141413]"
        >
          Acervo Brasilis
        </button>

        {/* Zone 2 (Desktop): 4 single-line navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden sm:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`cursor-pointer border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141413] ${
                  isActive
                    ? "border-[#8B3A1E] text-[#141413]"
                    : "border-transparent text-[#6E6A63] hover:border-[#C5BFB2] hover:text-[#141413]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRandomArtwork}
            aria-label="Obra Aleatória"
            className="inline-flex cursor-pointer items-center gap-1.5 border border-[#141413] bg-[#141413] px-3 py-1.5 text-xs font-medium tracking-wide text-[#F7F6F2] transition-colors hover:bg-[#8B3A1E] hover:border-[#8B3A1E] sm:gap-2 sm:px-4 sm:py-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141413]"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Obra Aleatória</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip: unclipped full-width access to all 4 sections */}
      <nav
        aria-label="Navegação principal móvel"
        className="flex sm:hidden items-center justify-between border-t border-[#E6E1D6] px-4 py-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`cursor-pointer border-b-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141413] ${
                isActive
                  ? "border-[#8B3A1E] text-[#141413]"
                  : "border-transparent text-[#6E6A63] hover:text-[#141413]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
