import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "default" | "success" | "danger" | "income" | "expense" | "investment" | "goal";
}

const BADGE_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-income/10 text-income",
  danger: "bg-danger/10 text-danger",
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
  investment: "bg-investment/10 text-investment",
  goal: "bg-goal/10 text-goal",
};

export default function StatCard({ label, value, icon: Icon, trend, accent = "default" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex items-center justify-center w-8 h-8 rounded-full shrink-0", BADGE_STYLES[accent])}>
          <Icon size={16} />
        </span>
      </div>
      <span className="text-2xl font-display font-semibold tabular-nums">{value}</span>
      {trend && (
        <span className={cn("text-xs", trend.positive ? "text-income" : "text-danger")}>
          {trend.positive ? "▲" : "▼"} {trend.value} vs mese scorso
        </span>
      )}
    </div>
  );
}
