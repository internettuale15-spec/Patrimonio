import { addMonths, addYears, setDate } from "date-fns";
import type { RecurrenceType } from "@/types";

export interface RecurrenceInput {
  type: RecurrenceType;
  startDate: string;      // ISO yyyy-mm-dd
  dayOfMonth?: number;     // per mensile
  monthOfYear?: number;    // per annuale (1-12)
  endDate?: string | null;
}

/**
 * Calcola la prossima data di generazione per una ricorrenza.
 * La generazione effettiva delle righe (incomes/expenses) in produzione
 * va fatta lato server con una Supabase Edge Function schedulata (cron
 * giornaliero) che legge le recurrences con next_run_date <= oggi,
 * inserisce la riga corrispondente e avanza next_run_date.
 */
export function computeNextRunDate(input: RecurrenceInput): Date {
  const start = new Date(input.startDate);

  if (input.type === "una_tantum") return start;

  if (input.type === "mensile") {
    const day = input.dayOfMonth ?? start.getDate();
    return setDate(addMonths(start, 0), Math.min(day, 28));
  }

  // annuale
  return addYears(start, 0);
}

export function advanceRecurrence(current: Date, type: RecurrenceType): Date {
  if (type === "mensile") return addMonths(current, 1);
  if (type === "annuale") return addYears(current, 1);
  return current;
}

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  una_tantum: "Una tantum",
  mensile: "Mensile",
  annuale: "Annuale",
};
