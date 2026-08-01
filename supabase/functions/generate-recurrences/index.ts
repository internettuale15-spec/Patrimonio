// Supabase Edge Function — da schedulare giornalmente (vedi README per il cron).
// Per ogni recurrence attiva con next_run_date <= oggi:
//  1. trova l'ultima riga (incomes o expenses) generata da quella recurrence
//     e la usa come "template" per creare la nuova occorrenza
//  2. inserisce la nuova riga con date = next_run_date
//  3. avanza next_run_date sulla recurrence (o la disattiva se oltre end_date)

import { getServiceClient } from "../_shared/supabaseClient.ts";

function addMonthsClamped(date: Date, months: number, dayOfMonth?: number | null): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  if (dayOfMonth) d.setDate(Math.min(dayOfMonth, 28));
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const supabase = getServiceClient();
  const today = toISODate(new Date());

  const { data: dueRecurrences, error } = await supabase
    .from("recurrences")
    .select("*")
    .eq("active", true)
    .lte("next_run_date", today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: Record<string, string> = {};

  for (const recurrence of dueRecurrences ?? []) {
    try {
      // Cerca il template in incomes, poi in expenses
      let table: "incomes" | "expenses" = "incomes";
      let { data: template } = await supabase
        .from("incomes")
        .select("*")
        .eq("recurrence_id", recurrence.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!template) {
        table = "expenses";
        const res = await supabase
          .from("expenses")
          .select("*")
          .eq("recurrence_id", recurrence.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        template = res.data;
      }

      if (!template) {
        results[recurrence.id] = "nessun template trovato, saltata";
        continue;
      }

      const insertPayload: Record<string, unknown> = {
        household_id: template.household_id,
        user_id: template.user_id,
        category_id: template.category_id,
        recurrence_id: recurrence.id,
        amount: template.amount,
        date: recurrence.next_run_date,
        description: template.description,
        created_by: template.created_by,
      };
      const { error: insertError } = await supabase.from(table).insert(insertPayload);
      if (insertError) throw insertError;

      // Calcola la prossima occorrenza
      const currentDue = new Date(recurrence.next_run_date);
      let nextRun: Date;
      if (recurrence.type === "mensile") {
        nextRun = addMonthsClamped(currentDue, recurrence.interval_count ?? 1, recurrence.day_of_month);
      } else if (recurrence.type === "annuale") {
        nextRun = addYears(currentDue, recurrence.interval_count ?? 1);
      } else {
        // una_tantum non dovrebbe ricorrere: disattiva
        await supabase.from("recurrences").update({ active: false }).eq("id", recurrence.id);
        results[recurrence.id] = "una tantum eseguita, disattivata";
        continue;
      }

      const pastEnd = recurrence.end_date && toISODate(nextRun) > recurrence.end_date;
      await supabase
        .from("recurrences")
        .update({
          next_run_date: toISODate(nextRun),
          active: !pastEnd,
        })
        .eq("id", recurrence.id);

      results[recurrence.id] = `occorrenza creata in ${table}, prossima il ${toISODate(nextRun)}`;
    } catch (err) {
      results[recurrence.id] = `errore: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return new Response(JSON.stringify({ processed: dueRecurrences?.length ?? 0, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
