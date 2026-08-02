import {
  Wallet, Landmark, LineChart as LineChartIcon, TrendingUp, TrendingDown,
  PiggyBank, PieChart as PieChartIcon, Target, ListChecks, Lightbulb, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

const INSIGHT_ICON = { warning: AlertTriangle, positive: Sparkles, neutral: Lightbulb };
const INSIGHT_STYLE = {
  warning: "bg-danger/10 text-danger",
  positive: "bg-income/10 text-income",
  neutral: "bg-investment/10 text-investment",
};

export default function Dashboard() {
  const { loading, summary, netWorthHistory, savingsHistory, recentMovements, insights } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Caricamento dati...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Panoramica del patrimonio familiare</p>
      </div>

      {/* Insight automatici — "cosa sta succedendo", non solo numeri */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-2">
          {insights.map((insight, i) => {
            const Icon = INSIGHT_ICON[insight.type];
            return (
              <div key={i} className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm", INSIGHT_STYLE[insight.type])}>
                <Icon size={16} className="mt-0.5 shrink-0" />
                <span>{insight.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Widget principali */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Patrimonio Totale" value={formatCurrency(summary.netWorth)} icon={Wallet} />
        <StatCard label="Liquidità" value={formatCurrency(summary.liquidity)} icon={Landmark} />
        <StatCard label="Investimenti" value={formatCurrency(summary.investmentsValue)} icon={LineChartIcon} />
        <StatCard
          label="Budget Utilizzato"
          value={formatPercent(summary.budgetUsedPct)}
          icon={PiggyBank}
          accent={summary.budgetUsedPct > 0.9 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Entrate Mese" value={formatCurrency(summary.monthlyIncome)} icon={TrendingUp} accent="success" />
        <StatCard label="Spese Mese" value={formatCurrency(summary.monthlyExpense)} icon={TrendingDown} accent="danger" />
        <StatCard
          label="Risparmio Mese"
          value={formatCurrency(summary.monthlySavings)}
          icon={PiggyBank}
          trend={
            summary.monthlySavingsTrendPct != null
              ? { value: formatPercent(Math.abs(summary.monthlySavingsTrendPct)), positive: summary.monthlySavingsTrendPct >= 0 }
              : undefined
          }
        />
        <StatCard label="Entrate Anno" value={formatCurrency(summary.yearlyIncome)} icon={TrendingUp} accent="success" />
        <StatCard label="Spese Anno" value={formatCurrency(summary.yearlyExpense)} icon={TrendingDown} accent="danger" />
        <StatCard label="Risparmio Anno" value={formatCurrency(summary.yearlySavings)} icon={PieChartIcon} />
      </div>

      <StatCard
        label="Obiettivi Raggiunti"
        value={`${summary.goalsCompletedCount} / ${summary.goalsTotalCount}`}
        icon={Target}
      />

      {/* Grafici andamento */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">Andamento Patrimonio</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={netWorthHistory}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 56% 28%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160 56% 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="value" stroke="hsl(160 56% 28%)" fill="url(#netWorthGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">Andamento Risparmio</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={savingsHistory}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="value" stroke="hsl(144 37% 48%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ultimi movimenti */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <ListChecks size={16} /> Ultimi Movimenti
        </h2>
        <div className="flex flex-col divide-y divide-border">
          {recentMovements.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">Nessun movimento registrato.</p>
          )}
          {recentMovements.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{m.desc}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                </p>
              </div>
              <span className={m.amount > 0 ? "text-success" : "text-foreground"}>
                {m.amount > 0 ? "+" : ""}{formatCurrency(m.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
