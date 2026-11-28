import { ChevronDown } from "lucide-react";
import { MegaMenu, type MegaMenuProps } from "./MegaMenu";

export type AppSection = "explorar" | "artistas" | "movimentos" | "mapa";

interface HeaderProps extends Omit<MegaMenuProps, "isOpen" | "onClose"> {
  isMegaMenuOpen: boolean;
  onToggleMegaMenu: () => void;
  onCloseMegaMenu: () => void;
  activeFilterCount: number;
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
  isMegaMenuOpen,
  onToggleMegaMenu,
  onCloseMegaMenu,
  activeFilterCount,
  ...megaMenuProps
}: HeaderProps) {
  return (
    <header className="relative z-40 border-b border-[#EAE8E3] bg-[#FAFAF8]">
      <div className="relative z-20 mx-auto flex max-w-[1360px] items-center justify-between gap-8 bg-[#FAFAF8] px-4 py-3.5 sm:px-8 sm:py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => {
            onSelectSection("explorar");
            onCloseMegaMenu();
          }}
          className="font-editorial cursor-pointer text-left text-xl font-semibold tracking-tight text-[#111110] whitespace-nowrap shrink-0 sm:text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111110]"
        >
          Acervo Brasilis
        </button>

        {/* Zone 2 (Desktop): 4 clean single-line navigation links */}
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
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMegaMenu();
                }}
                aria-current={isActive ? "page" : undefined}
                className={`cursor-pointer border-b py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111110] ${
                  isActive
                    ? "border-[#111110] text-[#111110]"
                    : "border-transparent text-[#706D67] hover:border-[#C9C6BE] hover:text-[#111110]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action — Collapsible Mega Menu Trigger */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleMegaMenu}
            aria-expanded={isMegaMenuOpen}
            aria-controls="curatorial-mega-menu"
            className={`inline-flex cursor-pointer items-center gap-2 border px-4 py-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111110] ${
              isMegaMenuOpen
                ? "border-[#111110] bg-[#111110] text-white"
                : "border-[#DDDAD2] bg-white text-[#111110] hover:border-[#111110]"
            }`}
          >
            <span>
              Curadoria
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isMegaMenuOpen ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <nav
        aria-label="Navegação principal móvel"
        className="relative z-20 flex sm:hidden items-center justify-between border-t border-[#EAE8E3] bg-[#FAFAF8] px-4 py-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMegaMenu();
              }}
              aria-current={isActive ? "page" : undefined}
              className={`cursor-pointer border-b py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111110] ${
                isActive
                  ? "border-[#111110] text-[#111110]"
                  : "border-transparent text-[#706D67] hover:text-[#111110]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={onCloseMegaMenu}
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        {...megaMenuProps}
      />
    </header>
  );
}
