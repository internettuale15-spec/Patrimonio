import {
  LayoutDashboard, TrendingUp, TrendingDown, Home as HomeIcon,
  LineChart, Wallet, Target, PiggyBank, Calendar as CalendarIcon,
  FileText, Sparkles, Send, Repeat, Tags, ShieldCheck,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// Menu raggruppato per area di senso — unica fonte di verità condivisa
// tra la sidebar desktop e il menu a comparsa mobile, così restano sempre
// allineati senza doverli aggiornare in due posti diversi.
export const NAV_GROUPS: NavGroup[] = [
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

// Le 3 destinazioni più usate quotidianamente + "Altro" per aprire il menu
// completo — spazio limitato nella bottom nav, il resto sta nel drawer.
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/spese", label: "Spese", icon: TrendingDown },
  { to: "/entrate", label: "Entrate", icon: TrendingUp },
  { to: "/budget", label: "Budget", icon: PiggyBank },
];
