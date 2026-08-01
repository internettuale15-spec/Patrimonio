import { useState } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Select } from "@/components/ui/Field";
import { MonthlyIncomeExpenseChart } from "@/components/reports/MonthlyIncomeExpenseChart";
import { useAnnualReport } from "@/hooks/useAnnualReport";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatPercent } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function Report() {
  const { householdId } = useAuthStore();
  const [year, setYear] = useState(CURRENT_YEAR);
  const {
    loading, totalIncome, totalExpense, savings, avgMonthly, avgDaily,
    monthlyTotals, topCategories, incomeVsPrevYear, expenseVsPrevYear,
  } = useAnnualReport(householdId, year);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Report</h1>
          <p className="text-sm text-muted-foreground">Bilancio annuale e andamento per categoria</p>
        </div>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Entrate Annuali"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          accent="success"
          trend={{ value: formatPercent(Math.abs(incomeVsPrevYear)), positive: incomeVsPrevYear >= 0 }}
        />
        <StatCard
          label="Spese Annuali"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          accent="danger"
          trend={{ value: formatPercent(Math.abs(expenseVsPrevYear)), positive: expenseVsPrevYear <= 0 }}
        />
        <StatCard label="Risparmio Annuale" value={formatCurrency(savings)} icon={PiggyBank} />
        <StatCard label="Media Mensile" value={formatCurrency(avgMonthly)} icon={Calendar} />
        <StatCard label="Media Giornaliera" value={formatCurrency(avgDaily)} icon={Calendar} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Entrate vs Spese per Mese</h2>
        {!loading && <MonthlyIncomeExpenseChart data={monthlyTotals} />}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Spese per Categoria</h2>
        {topCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nessuna spesa registrata per {year}.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                <span>{c.name}</span>
                <span className="tabular-nums font-medium">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
