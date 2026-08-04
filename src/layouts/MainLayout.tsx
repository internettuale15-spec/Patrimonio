import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Home as HomeIcon,
  LineChart, Wallet, Target, PiggyBank, Calendar as CalendarIcon,
  FileText, Search, Moon, Sun, Sparkles, Settings, Sprout, Send, Repeat, Tags, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

// Menu raggruppato per area di senso, non più un elenco piatto di 14 voci —
// riduce il carico cognitivo di dover scorrere tutto per trovare quello che serve.
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Movimenti",
    items: [
      { to: "/entrate", label: "Entrate", icon: TrendingUp },
      { to: "/spese", label: "Spese", icon: TrendingDown },
      { to: "/casa", label: "Casa", icon: HomeIcon },
    ],
  },
  {
    label: "Patrimonio",
    items: [
      { to: "/investimenti", label: "Investimenti", icon: LineChart },
      { to: "/patrimonio", label: "Patrimonio", icon: Wallet },
      { to: "/obiettivi", label: "Obiettivi", icon: Target },
    ],
  },
  {
    label: "Pianificazione",
    items: [
      { to: "/budget", label: "Budget", icon: PiggyBank },
      { to: "/ricorrenze", label: "Ricorrenze", icon: Repeat },
      { to: "/calendario", label: "Calendario", icon: CalendarIcon },
    ],
  },
  {
    label: "Strumenti",
    items: [
      { to: "/categorie", label: "Categorie", icon: Tags },
      { to: "/consulente", label: "Consulente", icon: ShieldCheck },
      { to: "/report", label: "Report", icon: FileText },
      { to: "/previsioni", label: "Previsioni", icon: Sparkles },
      { to: "/telegram", label: "Telegram", icon: Send },
    ],
  },
];

// Le 4 destinazioni più usate quotidianamente, per la bottom nav mobile
// (spazio limitato — il resto resta raggiungibile da "Tu" → menu completo)
const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/spese", label: "Spese", icon: TrendingDown },
  { to: "/entrate", label: "Entrate", icon: TrendingUp },
  { to: "/budget", label: "Budget", icon: PiggyBank },
];

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-colors",
          isActive
            ? "bg-white text-primary shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  );
}

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
      <OnboardingTutorial />
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground p-4 gap-0.5 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
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

        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? "root"} className={cn("flex flex-col gap-0.5", i > 0 && "mt-3")}>
            {group.label && (
              <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/45">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </div>
        ))}

        <div className="mt-auto pt-3 border-t border-white/15">
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
