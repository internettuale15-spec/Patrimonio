import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const MONTH_LABELS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

interface RawRow {
  amount: number;
  date: string;
  category_id: string | null;
  categories: { name: string } | null;
}

export interface MonthlyTotal {
  month: string;
  entrate: number;
  spese: number;
}

export interface CategoryTotal {
  name: string;
  amount: number;
}

export function useAnnualReport(householdId: string | null, year: number) {
  const [incomes, setIncomes] = useState<RawRow[]>([]);
  const [expenses, setExpenses] = useState<RawRow[]>([]);
  const [prevYearTotals, setPrevYearTotals] = useState({ incomes: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);

    const fetchYear = (table: string, y: number) =>
      supabase
        .from(table)
        .select("amount, date, category_id, categories(name)")
        .eq("household_id", householdId)
        .gte("date", `${y}-01-01`)
        .lte("date", `${y}-12-31`);

    const [incomesRes, expensesRes, prevIncomesRes, prevExpensesRes] = await Promise.all([
      fetchYear("incomes", year),
      fetchYear("expenses", year),
      fetchYear("incomes", year - 1),
      fetchYear("expenses", year - 1),
    ]);

    setIncomes((incomesRes.data ?? []) as unknown as RawRow[]);
    setExpenses((expensesRes.data ?? []) as unknown as RawRow[]);
    setPrevYearTotals({
      incomes: ((prevIncomesRes.data ?? []) as unknown as RawRow[]).reduce((s, r) => s + Number(r.amount), 0),
      expenses: ((prevExpensesRes.data ?? []) as unknown as RawRow[]).reduce((s, r) => s + Number(r.amount), 0),
    });
    setLoading(false);
  }, [householdId, year]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalIncome = incomes.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpense = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const savings = totalIncome - totalExpense;

  const isCurrentYear = year === new Date().getFullYear();
  const monthsElapsed = isCurrentYear ? new Date().getMonth() + 1 : 12;
  const daysElapsed = isCurrentYear
    ? Math.ceil((Date.now() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  const avgMonthly = monthsElapsed ? savings / monthsElapsed : 0;
  const avgDaily = daysElapsed ? savings / daysElapsed : 0;

  const monthlyTotals: MonthlyTotal[] = MONTH_LABELS.map((label, i) => {
    const entrate = incomes.filter((r) => new Date(r.date).getMonth() === i).reduce((s, r) => s + Number(r.amount), 0);
    const spese = expenses.filter((r) => new Date(r.date).getMonth() === i).reduce((s, r) => s + Number(r.amount), 0);
    return { month: label, entrate, spese };
  });

  const categoryMap = new Map<string, number>();
  expenses.forEach((r) => {
    const name = r.categories?.name ?? "Altro";
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + Number(r.amount));
  });
  const topCategories: CategoryTotal[] = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const incomeVsPrevYear = prevYearTotals.incomes ? (totalIncome - prevYearTotals.incomes) / prevYearTotals.incomes : 0;
  const expenseVsPrevYear = prevYearTotals.expenses ? (totalExpense - prevYearTotals.expenses) / prevYearTotals.expenses : 0;

  return {
    loading, totalIncome, totalExpense, savings, avgMonthly, avgDaily,
    monthlyTotals, topCategories, prevYearTotals, incomeVsPrevYear, expenseVsPrevYear,
  };
}
