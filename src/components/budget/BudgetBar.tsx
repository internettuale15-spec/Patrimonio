import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type { BudgetRow } from "@/hooks/useBudgets";

const RING_STROKE = {
  success: "stroke-income",
  warning: "stroke-goal",
  danger: "stroke-danger",
};

const TEXT_COLOR = {
  success: "text-income",
  warning: "text-goal",
  danger: "text-danger",
};

export function BudgetBar({ row, onDelete }: { row: BudgetRow; onDelete?: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4 group">
      <ProgressRing pct={row.pct} colorClass={RING_STROKE[row.color]}>
        <span className={TEXT_COLOR[row.color]}>{formatPercent(row.pct)}</span>
      </ProgressRing>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{row.categoryName}</span>
          {onDelete && (
            <button
              onClick={() => { if (confirm(`Eliminare il budget per "${row.categoryName}"?`)) onDelete(row.id); }}
              className="text-muted-foreground hover:text-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 p-2 -m-2"
              aria-label="Elimina"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatCurrency(row.spent)} di {formatCurrency(row.budgetAmount)}
        </p>
        <p className={cn("text-xs mt-1", row.remaining >= 0 ? "text-muted-foreground" : "text-danger")}>
          {row.remaining >= 0
            ? `${formatCurrency(row.remaining)} residui`
            : `${formatCurrency(Math.abs(row.remaining))} oltre budget`}
        </p>
      </div>
    </div>
  );
}
