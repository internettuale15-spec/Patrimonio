import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { formatCurrency } from "@/lib/utils";
import { NAV_GROUPS } from "@/layouts/navConfig";

const ALL_PAGES = NAV_GROUPS.flatMap((g) => g.items);

export function SearchBar() {
  const { householdId } = useAuthStore();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { results, loading } = useGlobalSearch(householdId, query);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const showDropdown = focused && query.trim().length >= 2;
  const matchingPages = ALL_PAGES.filter((p) =>
    p.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  function goTo(type: "entrata" | "spesa") {
    navigate(type === "entrata" ? "/entrate" : "/spese");
    setFocused(false);
    setQuery("");
  }

  function goToPage(to: string) {
    navigate(to);
    setFocused(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 text-muted-foreground bg-muted rounded-full px-3 py-1.5">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Cerca categoria, descrizione, importo..."
          className="bg-transparent outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20 max-h-96 overflow-y-auto">
          {matchingPages.length > 0 && (
            <div className="border-b border-border">
              <p className="px-4 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Pagine
              </p>
              {matchingPages.map((p) => (
                <button
                  key={p.to}
                  onClick={() => goToPage(p.to)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-muted text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary shrink-0">
                      <p.icon size={13} />
                    </span>
                    <span className="font-medium">{p.label}</span>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          {loading && <p className="text-xs text-muted-foreground px-4 py-3">Cerco nei movimenti...</p>}
          {!loading && results.length === 0 && matchingPages.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-3">Nessun risultato trovato.</p>
          )}
          {!loading &&
            results.length > 0 && (
              <div>
                {matchingPages.length > 0 && (
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Movimenti
                  </p>
                )}
                {results.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => goTo(r.type)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                          r.type === "entrata" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                        }`}
                      >
                        {r.type === "entrata" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{r.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.categoryName ? `${r.categoryName} · ` : ""}
                          {new Date(r.date).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                    <span className="tabular-nums text-xs shrink-0">{formatCurrency(r.amount)}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
