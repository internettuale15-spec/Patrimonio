import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RecurrenceType } from "@/types";

export interface RecurrenceRow {
  id: string;
  type: RecurrenceType;
  day_of_month: number | null;
  next_run_date: string;
  end_date: string | null;
  active: boolean;
  amount: number | null;
  description: string | null;
  categoryName: string | null;
  table: "incomes" | "expenses" | null;
}

export function useRecurrences(householdId: string | null) {
  const [recurrences, setRecurrences] = useState<RecurrenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);

    const { data: base } = await supabase
      .from("recurrences")
      .select("id, type, day_of_month, next_run_date, end_date, active")
      .eq("household_id", householdId)
      .order("next_run_date", { ascending: true });

    const rows: RecurrenceRow[] = [];
    for (const r of base ?? []) {
      let template: any = null;
      let table: "incomes" | "expenses" | null = null;

      const { data: income } = await supabase
        .from("incomes")
        .select("amount, description, categories(name)")
        .eq("recurrence_id", r.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (income) {
        template = income;
        table = "incomes";
      } else {
        const { data: expense } = await supabase
          .from("expenses")
          .select("amount, description, categories(name)")
          .eq("recurrence_id", r.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        template = expense;
        table = expense ? "expenses" : null;
      }

      rows.push({
        ...r,
        amount: template ? Number(template.amount) : null,
        description: template?.description ?? null,
        categoryName: template?.categories?.name ?? null,
        table,
      });
    }

    setRecurrences(rows);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from("recurrences").update({ active }).eq("id", id);
    if (error) throw error;
    await refetch();
  }

  async function deleteRecurrence(id: string) {
    const { error } = await supabase.from("recurrences").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  return { recurrences, loading, refetch, toggleActive, deleteRecurrence };
}
