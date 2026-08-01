import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Deadline } from "@/types";

export interface DeadlineWithStatus extends Deadline {
  daysUntil: number;
  status: "scaduta" | "urgente" | "prossima" | "futura";
}

function computeStatus(dueDate: string, notifyDaysBefore: number, isPaid: boolean): { daysUntil: number; status: DeadlineWithStatus["status"] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (isPaid) return { daysUntil, status: "futura" };
  if (daysUntil < 0) return { daysUntil, status: "scaduta" };
  if (daysUntil <= notifyDaysBefore) return { daysUntil, status: "urgente" };
  if (daysUntil <= 14) return { daysUntil, status: "prossima" };
  return { daysUntil, status: "futura" };
}

export function useDeadlines(householdId: string | null) {
  const [deadlines, setDeadlines] = useState<DeadlineWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("deadlines")
      .select("*")
      .eq("household_id", householdId)
      .order("due_date");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Errore caricamento scadenze:", error.message);
      setDeadlines([]);
    } else {
      const withStatus = ((data ?? []) as Deadline[]).map((d) => ({
        ...d,
        ...computeStatus(d.due_date, 3, d.is_paid),
      }));
      setDeadlines(withStatus);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function togglePaid(id: string, isPaid: boolean) {
    const { error } = await supabase.from("deadlines").update({ is_paid: isPaid }).eq("id", id);
    if (error) throw error;
    await refetch();
  }

  async function deleteDeadline(id: string) {
    const { error } = await supabase.from("deadlines").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  const upcoming = deadlines.filter((d) => !d.is_paid && d.daysUntil >= 0);
  const overdue = deadlines.filter((d) => !d.is_paid && d.daysUntil < 0);
  const notifyCount = deadlines.filter((d) => d.status === "urgente").length;

  return { deadlines, upcoming, overdue, notifyCount, loading, refetch, togglePaid, deleteDeadline };
}
