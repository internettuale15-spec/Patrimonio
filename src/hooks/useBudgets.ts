import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { budgetColor } from "@/lib/utils";

export interface BudgetRow {
  id: string;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  pct: number;
  color: "success" | "warning" | "danger";
}

export function useBudgets(householdId: string | null, month: number, year: number) {
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);

    const [budgetsRes, expensesRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("id, amount, category_id, categories(name)")
        .eq("household_id", householdId)
        .eq("month", month)
        .eq("year", year),
      supabase
        .from("expenses")
        .select("amount, category_id, date")
        .eq("household_id", householdId),
    ]);

    const budgets = (budgetsRes.data ?? []) as unknown as {
      id: string; amount: number; category_id: string; categories: { name: string } | null;
    }[];

    const spentByCategory = new Map<string, number>();
    ((expensesRes.data ?? []) as { amount: number; category_id: string | null; date: string }[]).forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() + 1 === month && d.getFullYear() === year && e.category_id) {
        spentByCategory.set(e.category_id, (spentByCategory.get(e.category_id) ?? 0) + Number(e.amount));
      }
    });

    const computed: BudgetRow[] = budgets.map((b) => {
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const pct = b.amount ? spent / b.amount : 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: b.categories?.name ?? "Categoria",
        budgetAmount: b.amount,
        spent,
        remaining: b.amount - spent,
        pct,
        color: budgetColor(pct),
      };
    });

    setRows(computed);
    setLoading(false);
  }, [householdId, month, year]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalBudget = rows.reduce((sum, r) => sum + r.budgetAmount, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const totalPct = totalBudget ? totalSpent / totalBudget : 0;

  async function deleteBudget(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  return { rows, loading, refetch, totalBudget, totalSpent, totalPct, deleteBudget };
}
