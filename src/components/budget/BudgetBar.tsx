import { useState } from "react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { Trash2, Pencil, Check, X, Plus } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Input } from "@/components/ui/Field";
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

export function BudgetBar({
  row, onDelete, onEditAmount, onQuickExpense,
}: {
  row: BudgetRow;
  onDelete?: (id: string) => void;
  onEditAmount?: (id: string, amount: number) => Promise<void>;
  onQuickExpense?: (categoryId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(row.budgetAmount));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const value = Number(amount);
    if (!value || value === row.budgetAmount) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onEditAmount?.(row.id, value);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4 group">
      <ProgressRing pct={row.pct} colorClass={RING_STROKE[row.color]}>
        <span className={TEXT_COLOR[row.color]}>{formatPercent(row.pct)}</span>
      </ProgressRing>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{row.categoryName}</span>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {onQuickExpense && (
              <button
                onClick={() => onQuickExpense(row.categoryId)}
                className="text-muted-foreground hover:text-primary p-2 -m-2"
                aria-label="Registra spesa"
                title="Registra spesa in questa categoria"
              >
                <Plus size={14} />
              </button>
            )}
            {onEditAmount && (
              <button
                onClick={() => setEditing(true)}
                className="text-muted-foreground hover:text-foreground p-2 -m-2"
                aria-label="Modifica budget"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { if (confirm(`Eliminare il budget per "${row.categoryName}"?`)) onDelete(row.id); }}
                className="text-muted-foreground hover:text-danger p-2 -m-2"
                aria-label="Elimina"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") { setAmount(String(row.budgetAmount)); setEditing(false); }
              }}
            />
            <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-full hover:bg-muted text-income shrink-0">
              <Check size={16} />
            </button>
            <button
              onClick={() => { setAmount(String(row.budgetAmount)); setEditing(false); }}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(row.spent)} di {formatCurrency(row.budgetAmount)}
            </p>
            <p className={cn("text-xs mt-1", row.remaining >= 0 ? "text-muted-foreground" : "text-danger")}>
              {row.remaining >= 0
                ? `${formatCurrency(row.remaining)} residui`
                : `${formatCurrency(Math.abs(row.remaining))} oltre budget`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
