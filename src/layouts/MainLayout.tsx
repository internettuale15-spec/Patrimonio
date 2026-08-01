import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Home as HomeIcon,
  LineChart, Wallet, Target, PiggyBank, Calendar as CalendarIcon,
  FileText, Search, Moon, Sun, Sparkles, Settings, Sprout,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/entrate", label: "Entrate", icon: TrendingUp },
  { to: "/spese", label: "Spese", icon: TrendingDown },
  { to: "/casa", label: "Casa", icon: HomeIcon },
  { to: "/investimenti", label: "Investimenti", icon: LineChart },
  { to: "/patrimonio", label: "Patrimonio", icon: Wallet },
  { to: "/obiettivi", label: "Obiettivi", icon: Target },
  { to: "/budget", label: "Budget", icon: PiggyBank },
  { to: "/calendario", label: "Calendario", icon: CalendarIcon },
  { to: "/report", label: "Report", icon: FileText },
  { to: "/previsioni", label: "Previsioni", icon: Sparkles },
];

// Sottoinsieme mostrato nella bottom nav mobile (spazio limitato)
const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

export default function MainLayout() {
  const [dark, setDark] = useState(false);
  const profile = useAuthStore((s) => s.profile);

  const toggleDark = () => {
    setDark((prev) => {
      document.documentElement.classList.toggle("dark", !prev);
      return !prev;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground p-4 gap-1 shrink-0">
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="font-display font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
              <Sprout size={18} />
            </span>
            Famiglia
          </span>
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-white/10">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="mt-auto pt-2 border-t border-white/15">
          <NavLink
            to="/impostazioni"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                isActive ? "bg-white text-primary shadow-sm" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Settings size={18} />
            {profile?.full_name ?? "Impostazioni"}
          </NavLink>
        </div>
      </aside>

      {/* Contenuto */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground w-full max-w-sm bg-muted rounded-full px-3 py-1.5">
            <Search size={16} />
            <input
              placeholder="Cerca categoria, descrizione, importo..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <button onClick={toggleDark} className="md:hidden p-2 rounded-full hover:bg-muted">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-card flex justify-around py-2 z-10">
        {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/impostazioni"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-full",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <Settings size={20} />
          Tu
        </NavLink>
      </nav>
    </div>
  );
}
