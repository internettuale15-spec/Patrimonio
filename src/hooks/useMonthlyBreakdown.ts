import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CategoryDatum, TimeSeriesDatum } from "@/components/charts/CategoryBreakdownCharts";
import type { TransactionRow } from "@/components/transactions/TransactionList";
import type { CategoryKind } from "@/types";

const PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4",
  "#a855f7", "#ec4899", "#84cc16", "#0ea5e9", "#f97316",
  "#14b8a6", "#8b5cf6",
];

type RawRow = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  attachment_url?: string | null;
  category_id: string | null;
  categories: { name: string; kind: CategoryKind } | null;
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("it-IT", { month: "short" });
}

export function useMonthlyBreakdown(
  table: "incomes" | "expenses" | "home_expenses",
  householdId: string | null,
  categoryKindFilter?: CategoryKind[]
) {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const hasAttachment = table !== "incomes";
    const columns = hasAttachment
      ? "id, amount, date, description, attachment_url, category_id, categories(name, kind)"
      : "id, amount, date, description, category_id, categories(name, kind)";
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("household_id", householdId)
      .order("date", { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`Errore caricamento ${table}:`, error.message);
      setRows([]);
    } else {
      const all = (data ?? []) as unknown as RawRow[];
      const filtered = categoryKindFilter
        ? all.filter((r) => r.categories && categoryKindFilter.includes(r.categories.kind))
        : all;
      setRows(filtered);
    }
    setLoading(false);
  }, [table, householdId, categoryKindFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const now = new Date();
  const currentKey = monthKey(now);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = monthKey(prevDate);

  const currentRows = rows.filter((r) => monthKey(new Date(r.date)) === currentKey);
  const prevRows = rows.filter((r) => monthKey(new Date(r.date)) === prevKey);

  const byCategory = new Map<string, { name: string; amount: number }>();
  currentRows.forEach((r) => {
    const key = r.category_id ?? "altro";
    const name = r.categories?.name ?? "Altro";
    const existing = byCategory.get(key) ?? { name, amount: 0 };
    existing.amount += Number(r.amount);
    byCategory.set(key, existing);
  });

  const prevByCategory = new Map<string, number>();
  prevRows.forEach((r) => {
    const key = r.category_id ?? "altro";
    prevByCategory.set(key, (prevByCategory.get(key) ?? 0) + Number(r.amount));
  });

  const categoryData: CategoryDatum[] = Array.from(byCategory.entries()).map(([id, v], i) => ({
    id,
    name: v.name,
    amount: v.amount,
    prevAmount: prevByCategory.get(id) ?? 0,
    color: PALETTE[i % PALETTE.length],
  }));

  // Serie storica ultimi 6 mesi (totale, non per categoria)
  const timeSeries: TimeSeriesDatum[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = monthKey(d);
    const total = rows
      .filter((r) => monthKey(new Date(r.date)) === key)
      .reduce((sum, r) => sum + Number(r.amount), 0);
    return { month: monthLabel(d), amount: total };
  });

  const transactionRows: TransactionRow[] = currentRows.map((r) => ({
    id: r.id,
    date: r.date,
    amount: Number(r.amount),
    description: r.description,
    categoryName: r.categories?.name ?? "Altro",
    attachmentUrl: r.attachment_url,
  }));

  const monthTotal = currentRows.reduce((sum, r) => sum + Number(r.amount), 0);
  const prevMonthTotal = prevRows.reduce((sum, r) => sum + Number(r.amount), 0);
  const yearTotal = rows
    .filter((r) => new Date(r.date).getFullYear() === now.getFullYear())
    .reduce((sum, r) => sum + Number(r.amount), 0);

  async function remove(id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  return {
    loading, refetch, categoryData, timeSeries, transactionRows,
    monthTotal, prevMonthTotal, yearTotal, remove,
  };
}
