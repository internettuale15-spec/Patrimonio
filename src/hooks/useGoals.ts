import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types";

export interface GoalWithProgress extends Goal {
  progressPct: number;
}

export function useGoals(householdId: string | null) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("household_id", householdId)
      .order("target_date", { ascending: true, nullsFirst: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Errore caricamento obiettivi:", error.message);
      setGoals([]);
    } else {
      const withProgress = ((data ?? []) as Goal[]).map((g) => ({
        ...g,
        progressPct: g.target_amount ? Math.min(g.current_amount / g.target_amount, 1) : 0,
      }));
      setGoals(withProgress);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const completedCount = goals.filter((g) => g.progressPct >= 1).length;

  async function addContribution(goalId: string, amount: number, notes?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { error: contribError } = await supabase.from("goal_contributions").insert({
      goal_id: goalId, amount, date: today, notes: notes || null,
    });
    if (contribError) throw contribError;

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const { error: updateError } = await supabase
        .from("goals")
        .update({ current_amount: goal.current_amount + amount })
        .eq("id", goalId);
      if (updateError) throw updateError;
    }
    await refetch();
  }

  async function deleteGoal(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  return { goals, loading, refetch, completedCount, addContribution, deleteGoal };
}
