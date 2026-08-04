import { NavLink } from "react-router-dom";
import { X, Settings, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { NavGroup } from "@/layouts/navConfig";

export function MobileMenuDrawer({
  open, onClose, groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
}) {
  const profile = useAuthStore((s) => s.profile);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-xs h-full bg-sidebar text-sidebar-foreground flex flex-col p-4 gap-0.5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-display font-semibold text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
              <Sprout size={18} />
            </span>
            Famiglia
          </span>
          <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10" aria-label="Chiudi menu">
            <X size={20} />
          </button>
        </div>

        {groups.map((group, i) => (
          <div key={group.label ?? "root"} className={cn("flex flex-col gap-0.5", i > 0 && "mt-3")}>
            {group.label && (
              <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/45">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="mt-3 pt-3 border-t border-white/15">
          <NavLink
            to="/impostazioni"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                isActive ? "bg-white text-primary shadow-sm" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Settings size={18} />
            {profile?.full_name ?? "Impostazioni"}
          </NavLink>
        </div>
      </div>
    </div>
  );
}
