import { TrendingUp, TrendingDown, PiggyBank, Wallet, Info } from "lucide-react";
import StatCard from "@/components/StatCard";
import { usePrevisioni } from "@/hooks/usePrevisioni";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";

export default function Previsioni() {
  const { householdId } = useAuthStore();
  const {
    loading, monthsElapsed, monthsRemaining, avgMonthlyIncome, avgMonthlyExpense,
    forecastIncome, forecastExpense, forecastSavings, forecastNetWorth,
  } = usePrevisioni(householdId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Previsioni</h1>
        <p className="text-sm text-muted-foreground">Proiezioni a fine anno basate sulla media dei dati registrati</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Calcolate sulla media dei {monthsElapsed} mesi già registrati
          quest'anno, proiettata sui {monthsRemaining} mesi rimanenti. Più dati
          storici inserisci, più le previsioni diventano affidabili.
        </p>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Previsione Entrate Fine Anno" value={formatCurrency(forecastIncome)} icon={TrendingUp} accent="success" />
          <StatCard label="Previsione Spese Fine Anno" value={formatCurrency(forecastExpense)} icon={TrendingDown} accent="danger" />
          <StatCard label="Previsione Risparmio Fine Anno" value={formatCurrency(forecastSavings)} icon={PiggyBank} />
          <StatCard label="Previsione Patrimonio Fine Anno" value={formatCurrency(forecastNetWorth)} icon={Wallet} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Metodologia</h2>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>Media entrate mensile registrata: <span className="text-foreground font-medium">{formatCurrency(avgMonthlyIncome)}</span></p>
          <p>Media spese mensile registrata: <span className="text-foreground font-medium">{formatCurrency(avgMonthlyExpense)}</span></p>
          <p className="text-xs pt-2">
            Previsione = dati già registrati + (media mensile × mesi rimanenti).
            Non tiene conto di eventi straordinari (bonus, spese una tantum) non ancora inseriti.
          </p>
        </div>
      </div>
    </div>
  );
}
