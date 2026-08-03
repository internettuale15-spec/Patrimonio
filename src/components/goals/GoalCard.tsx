import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { GoalWithProgress } from "@/hooks/useGoals";

interface GoalCardProps {
  goal: GoalWithProgress;
  onContribute: (amount: number) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function GoalCard({ goal, onContribute, onDelete }: GoalCardProps) {
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const isComplete = goal.progressPct >= 1;
  const ringColor = goal.color ?? "#E8A33D";

  async function handleAdd() {
    if (!amount) return;
    setSaving(true);
    try {
      await onContribute(Number(amount));
      setAmount("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 group">
      <div className="flex items-center gap-4">
        <ProgressRing pct={goal.progressPct} color={ringColor}>
          {formatPercent(goal.progressPct)}
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{goal.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              {isComplete && <span className="text-xs text-income font-medium">✓ Raggiunto</span>}
              {onDelete && (
                <button
                  onClick={() => { if (confirm(`Eliminare l'obiettivo "${goal.name}"?`)) onDelete(goal.id); }}
                  className="text-muted-foreground hover:text-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 -m-2"
                  aria-label="Elimina"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatCurrency(goal.current_amount)} di {formatCurrency(goal.target_amount)}
          </p>
          {goal.target_date && (
            <p className="text-xs text-muted-foreground">
              Prevista per il {new Date(goal.target_date).toLocaleDateString("it-IT")}
            </p>
          )}
        </div>
      </div>

      {!isComplete && (
        adding ? (
          <div className="flex gap-2">
            <Input type="number" step="0.01" placeholder="Importo €" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "..." : "Aggiungi"}</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="self-start">
            <PlusCircle size={14} /> Versamento
          </Button>
        )
      )}
    </div>
  );
}
