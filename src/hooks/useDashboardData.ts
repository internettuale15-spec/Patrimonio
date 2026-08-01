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

      setSummary({
        netWorth,
        liquidity,
        investmentsValue,
        monthlyIncome,
        monthlyExpense,
        monthlySavings: monthlyIncome - monthlyExpense,
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

  return { loading, summary, netWorthHistory, savingsHistory, recentMovements };
}
