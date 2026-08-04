import { NavLink, Outlet } from "react-router-dom";
import { Moon, Sun, Sprout, Settings, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { SearchBar } from "@/components/SearchBar";
import { MobileMenuDrawer } from "@/components/MobileMenuDrawer";
import { NAV_GROUPS, MOBILE_NAV_ITEMS, type NavItem } from "@/layouts/navConfig";

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
  const [menuOpen, setMenuOpen] = useState(false);
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
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} groups={NAV_GROUPS} />

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
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-6 bg-card">
          <SearchBar />
          <button onClick={toggleDark} className="md:hidden p-2 rounded-full hover:bg-muted shrink-0">
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
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded-full text-muted-foreground"
        >
          <Menu size={20} />
          Altro
        </button>
      </nav>
    </div>
  );
}
