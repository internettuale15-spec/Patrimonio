import { useAnnualReport } from "@/hooks/useAnnualReport";
import { usePatrimonio } from "@/hooks/usePatrimonio";

export function usePrevisioni(householdId: string | null) {
  const year = new Date().getFullYear();
  const report = useAnnualReport(householdId, year);
  const patrimonio = usePatrimonio(householdId);

  const monthsElapsed = new Date().getMonth() + 1;
  const monthsRemaining = 12 - monthsElapsed;

  const avgMonthlyIncome = monthsElapsed ? report.totalIncome / monthsElapsed : 0;
  const avgMonthlyExpense = monthsElapsed ? report.totalExpense / monthsElapsed : 0;

  const forecastIncome = report.totalIncome + avgMonthlyIncome * monthsRemaining;
  const forecastExpense = report.totalExpense + avgMonthlyExpense * monthsRemaining;
  const forecastSavings = forecastIncome - forecastExpense;

  // Il patrimonio netto attuale include già il risparmio accumulato finora;
  // per la previsione a fine anno sommiamo solo il risparmio atteso nei mesi restanti.
  const remainingSavings = forecastSavings - report.savings;
  const forecastNetWorth = patrimonio.netWorth + remainingSavings;

  return {
    loading: report.loading || patrimonio.loading,
    monthsElapsed,
    monthsRemaining,
    avgMonthlyIncome,
    avgMonthlyExpense,
    forecastIncome,
    forecastExpense,
    forecastSavings,
    forecastNetWorth,
    currentNetWorth: patrimonio.netWorth,
  };
}
