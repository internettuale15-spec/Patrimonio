import { Repeat, Pause, Play, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRecurrences } from "@/hooks/useRecurrences";
import { formatCurrency } from "@/lib/utils";
import { RECURRENCE_LABELS } from "@/lib/recurrence";

export default function Ricorrenze() {
  const { householdId } = useAuthStore();
  const { recurrences, loading, toggleActive, deleteRecurrence } = useRecurrences(householdId);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Repeat size={20} className="text-primary" /> Ricorrenze
        </h1>
        <p className="text-sm text-muted-foreground">
          Entrate e spese che si ripetono da sole (es. stipendio, mutuo, abbonamenti) — le trovi
          già inserite ogni mese senza doverle riscrivere a mano.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Per crearne una nuova, aggiungi normalmente una spesa o un'entrata dalle rispettive
        pagine e scegli "Mensile" o "Annuale" nel campo Ricorrenza — comparirà qui.
      </div>

      {!loading && recurrences.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nessuna ricorrenza attiva al momento.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {recurrences.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
                r.table === "incomes" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
              }`}
            >
              {r.table === "incomes" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {r.description || r.categoryName || "Movimento ricorrente"}
                </span>
                {!r.active && (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                    In pausa
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {RECURRENCE_LABELS[r.type]}
                {r.day_of_month ? ` · giorno ${r.day_of_month}` : ""}
                {" · prossima il "}
                {new Date(r.next_run_date).toLocaleDateString("it-IT")}
              </p>
            </div>

            {r.amount != null && (
              <span className={`tabular-nums font-medium ${r.table === "incomes" ? "text-income" : "text-expense"}`}>
                {r.table === "expenses" ? "-" : "+"}{formatCurrency(r.amount)}
              </span>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleActive(r.id, !r.active)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                aria-label={r.active ? "Metti in pausa" : "Riattiva"}
                title={r.active ? "Metti in pausa" : "Riattiva"}
              >
                {r.active ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => {
                  if (confirm("Eliminare questa ricorrenza? I movimenti già registrati restano, ma non si genereranno più nuovi.")) {
                    deleteRecurrence(r.id);
                  }
                }}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-danger"
                aria-label="Elimina"
                title="Elimina"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
