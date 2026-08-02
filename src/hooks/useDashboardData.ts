import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { DashboardSummary } from "@/types";

export interface MonthPoint {
  month: string;
  value: number;
}

export interface Movement {
  id: string;
  desc: string;
  amount: number;
  date: string;
  type: "entrata" | "spesa" | "investimento";
}

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function lastNMonths(n: number) {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESI[d.getMonth()] });
  }
  return out;
}

export interface Insight {
  type: "warning" | "positive" | "neutral";
  text: string;
}

export function useDashboardData() {
  const householdId = useAuthStore((s) => s.householdId);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    netWorth: 0,
    liquidity: 0,
    investmentsValue: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
    monthlySavingsTrendPct: null,
    yearlyIncome: 0,
    yearlyExpense: 0,
    yearlySavings: 0,
    budgetUsedPct: 0,
    goalsCompletedCount: 0,
    goalsTotalCount: 0,
  });
  const [netWorthHistory, setNetWorthHistory] = useState<MonthPoint[]>([]);
  const [savingsHistory, setSavingsHistory] = useState<MonthPoint[]>([]);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);

      const [
        { data: incomes },
        { data: expenses },
        { data: investments },
        { data: assets },
        { data: liabilities },
        { data: goals },
        { data: budgets },
        { data: snapshots },
        { data: categories },
      ] = await Promise.all([
        supabase.from("incomes").select("id, amount, date, description").eq("household_id", householdId),
        supabase.from("expenses").select("id, amount, date, description, category_id").eq("household_id", householdId),
        supabase.from("investments").select("quantity, current_price").eq("household_id", householdId),
        supabase.from("assets").select("value, type").eq("household_id", householdId),
        supabase.from("liabilities").select("remaining_amount").eq("household_id", householdId),
        supabase.from("goals").select("current_amount, target_amount").eq("household_id", householdId),
        (() => {
          const now = new Date();
          return supabase
            .from("budgets")
            .select("amount, category_id")
            .eq("household_id", householdId)
            .eq("month", now.getMonth() + 1)
            .eq("year", now.getFullYear());
        })(),
        supabase
          .from("net_worth_snapshots")
          .select("date, net_worth")
          .eq("household_id", householdId)
          .order("date", { ascending: true }),
        supabase.from("categories").select("id, name").eq("household_id", householdId),
      ]);

      if (cancelled) return;

      const now = new Date();
      const curYear = now.getFullYear();
      const curMonthKey = `${curYear}-${now.getMonth()}`;

      const sumBy = (rows: { amount: number; date: string }[] | null, pred: (k: string) => boolean) =>
        (rows ?? []).filter((r) => pred(monthKey(r.date))).reduce((s, r) => s + Number(r.amount), 0);

      const monthlyIncome = sumBy(incomes, (k) => k === curMonthKey);
      const monthlyExpense = sumBy(expenses, (k) => k === curMonthKey);
      const yearlyIncome = (incomes ?? [])
        .filter((r) => new Date(r.date).getFullYear() === curYear)
        .reduce((s, r) => s + Number(r.amount), 0);
      const yearlyExpense = (expenses ?? [])
        .filter((r) => new Date(r.date).getFullYear() === curYear)
        .reduce((s, r) => s + Number(r.amount), 0);

      const investmentsValue = (investments ?? []).reduce(
        (s, i) => s + Number(i.quantity) * Number(i.current_price),
        0
      );
      const liquidity = (assets ?? [])
        .filter((a) => a.type === "conto_corrente" || a.type === "contanti")
        .reduce((s, a) => s + Number(a.value), 0);
      const totalAssets = (assets ?? []).reduce((s, a) => s + Number(a.value), 0);
      const totalLiabilities = (liabilities ?? []).reduce((s, l) => s + Number(l.remaining_amount), 0);
      const netWorth = totalAssets + investmentsValue - totalLiabilities;

      const goalsTotalCount = (goals ?? []).length;
      const goalsCompletedCount = (goals ?? []).filter((g) => Number(g.current_amount) >= Number(g.target_amount)).length;

      const budgetedCategoryIds = new Set((budgets ?? []).map((b) => b.category_id));
      const totalBudget = (budgets ?? []).reduce((s, b) => s + Number(b.amount), 0);
      const spentInBudgetedCategories = (expenses ?? [])
        .filter((e) => monthKey(e.date) === curMonthKey && budgetedCategoryIds.has(e.category_id))
        .reduce((s, e) => s + Number(e.amount), 0);
      const budgetUsedPct = totalBudget > 0 ? spentInBudgetedCategories / totalBudget : 0;

      // Storico 6 mesi: risparmio reale mese per mese
      const months = lastNMonths(6);
      const savings: MonthPoint[] = months.map(({ key, label }) => ({
        month: label,
        value: sumBy(incomes, (k) => k === key) - sumBy(expenses, (k) => k === key),
      }));

      // Patrimonio storico: usa gli snapshot reali se esistono, altrimenti
      // mostra solo il valore attuale (nessuno storico ancora disponibile)
      const netWorthHist: MonthPoint[] =
        snapshots && snapshots.length > 0
          ? snapshots.map((s) => ({
              month: MESI[new Date(s.date).getMonth()],
              value: Number(s.net_worth),
            }))
          : [{ month: MESI[now.getMonth()], value: netWorth }];

      // Ultimi movimenti (entrate + spese), più recenti prima
      const movs: Movement[] = [
        ...(incomes ?? []).map((i) => ({
          id: i.id,
          desc: i.description || "Entrata",
          amount: Number(i.amount),
          date: i.date,
          type: "entrata" as const,
        })),
        ...(expenses ?? []).map((e) => ({
          id: e.id,
          desc: e.description || "Spesa",
          amount: -Number(e.amount),
          date: e.date,
          type: "spesa" as const,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // --- Insight automatici: cosa vale la pena sapere questo mese ---
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthKey = monthKey(prevMonthDate.toISOString());
      const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

      const spendByCategory = (key: string) => {
        const map = new Map<string, number>();
        (expenses ?? [])
          .filter((e) => monthKey(e.date) === key)
          .forEach((e) => {
            const k = e.category_id ?? "altro";
            map.set(k, (map.get(k) ?? 0) + Number(e.amount));
          });
        return map;
      };
      const curByCat = spendByCategory(curMonthKey);
      const prevByCat = spendByCategory(prevMonthKey);

      const generatedInsights: Insight[] = [];

      // 1) Sforamenti di budget — priorità massima, è actionable
      const overBudget = (budgets ?? [])
        .map((b) => {
          const spent = (expenses ?? [])
            .filter((e) => monthKey(e.date) === curMonthKey && e.category_id === b.category_id)
            .reduce((s, e) => s + Number(e.amount), 0);
          return { name: categoryNameById.get(b.category_id) ?? "una categoria", spent, budget: Number(b.amount) };
        })
        .filter((b) => b.spent > b.budget)
        .sort((a, b) => b.spent - b.budget - (a.spent - a.budget))[0];

      if (overBudget) {
        generatedInsights.push({
          type: "warning",
          text: `Hai già superato il budget di "${overBudget.name}": ${overBudget.spent.toFixed(0)}€ su ${overBudget.budget.toFixed(0)}€ previsti questo mese.`,
        });
      }

      // 2) Categoria con l'aumento più marcato rispetto al mese scorso
      const jumps: { name: string; pct: number; diff: number }[] = [];
      curByCat.forEach((amount, catId) => {
        if (amount < 20) return; // ignora spese troppo piccole, aggiungono solo rumore
        const prevAmount = prevByCat.get(catId) ?? 0;
        if (prevAmount < 5) return; // niente da confrontare, non è un vero "aumento"
        const diff = amount - prevAmount;
        if (diff > 0) {
          jumps.push({ name: categoryNameById.get(catId) ?? "Altro", pct: diff / prevAmount, diff });
        }
      });
      const biggestJump = jumps.sort((a, b) => b.diff - a.diff)[0] ?? null;
      if (biggestJump) {
        generatedInsights.push({
          type: "neutral",
          text: `Questo mese hai speso il ${Math.round(biggestJump.pct * 100)}% in più in "${biggestJump.name}" rispetto al mese scorso (+${biggestJump.diff.toFixed(0)}€).`,
        });
      }

      // 3) Andamento risparmio rispetto al mese scorso, come nota positiva/di chiusura
      const prevMonthSavings = sumBy(incomes, (k) => k === prevMonthKey) - sumBy(expenses, (k) => k === prevMonthKey);
      const curMonthSavings = monthlyIncome - monthlyExpense;
      if (prevMonthSavings !== 0) {
        const savingsDiff = curMonthSavings - prevMonthSavings;
        if (savingsDiff > 0) {
          generatedInsights.push({
            type: "positive",
            text: `Stai risparmiando ${savingsDiff.toFixed(0)}€ in più rispetto al mese scorso — bene così.`,
          });
        }
      }

      setInsights(generatedInsights.slice(0, 3));

      setSummary({
        netWorth,
        liquidity,
        investmentsValue,
        monthlyIncome,
        monthlyExpense,
        monthlySavings: monthlyIncome - monthlyExpense,
        monthlySavingsTrendPct:
          prevMonthSavings !== 0 ? (curMonthSavings - prevMonthSavings) / Math.abs(prevMonthSavings) : null,
        yearlyIncome,
        yearlyExpense,
        yearlySavings: yearlyIncome - yearlyExpense,
        budgetUsedPct,
        goalsCompletedCount,
        goalsTotalCount,
      });
      setNetWorthHistory(netWorthHist);
      setSavingsHistory(savings);
      setRecentMovements(movs);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  return { loading, summary, netWorthHistory, savingsHistory, recentMovements, insights };
}
