import { Check, Bell, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { DeadlineWithStatus } from "@/hooks/useDeadlines";

const STATUS_STYLES: Record<DeadlineWithStatus["status"], string> = {
  scaduta: "bg-danger/10 text-danger",
  urgente: "bg-warning/10 text-warning",
  prossima: "bg-primary/10 text-primary",
  futura: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<DeadlineWithStatus["status"], (days: number) => string> = {
  scaduta: (d) => `Scaduta da ${Math.abs(d)}g`,
  urgente: (d) => (d === 0 ? "Oggi" : `Tra ${d}g`),
  prossima: (d) => `Tra ${d}g`,
  futura: (d) => `Tra ${d}g`,
};

export function DeadlineList({
  deadlines, onTogglePaid, onDelete,
}: {
  deadlines: DeadlineWithStatus[];
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  if (deadlines.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nessuna scadenza registrata.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {deadlines.map((d) => (
        <div key={d.id} className="flex items-center justify-between py-2.5 text-sm group">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTogglePaid(d.id, !d.is_paid)}
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                d.is_paid ? "bg-success border-success text-white" : "border-border"
              )}
            >
              {d.is_paid && <Check size={12} />}
            </button>
            <div>
              <p className={cn("font-medium", d.is_paid && "line-through text-muted-foreground")}>{d.title}</p>
              <p className="text-xs text-muted-foreground">
                {d.category} · {new Date(d.due_date).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {d.amount != null && <span className="tabular-nums text-xs">{formatCurrency(d.amount)}</span>}
            {!d.is_paid && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1", STATUS_STYLES[d.status])}>
                {d.status === "urgente" && <Bell size={10} />}
                {STATUS_LABELS[d.status](d.daysUntil)}
              </span>
            )}
            {onDelete && (
              <button
                onClick={() => { if (confirm(`Eliminare "${d.title}"?`)) onDelete(d.id); }}
                className="text-muted-foreground hover:text-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 -m-2"
                aria-label="Elimina"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
