import { formatCurrency, formatPercent } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { INVESTMENT_TYPE_LABELS, type InvestmentWithDerived } from "@/hooks/useInvestments";

export function InvestmentList({
  investments, onDelete,
}: {
  investments: InvestmentWithDerived[];
  onDelete?: (id: string) => void;
}) {
  if (investments.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nessun investimento registrato.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {investments.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between py-3 text-sm group">
          <div>
            <p className="font-medium">{inv.name}</p>
            <p className="text-xs text-muted-foreground">
              {INVESTMENT_TYPE_LABELS[inv.type]}
              {inv.broker ? ` · ${inv.broker}` : ""}
              {inv.ticker ? ` · ${inv.ticker}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatCurrency(inv.value)}</p>
              <p className={`text-xs tabular-nums ${inv.gain >= 0 ? "text-success" : "text-danger"}`}>
                {inv.gain >= 0 ? "+" : ""}{formatCurrency(inv.gain)} ({formatPercent(inv.gainPct)})
              </p>
            </div>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Eliminare "${inv.name}"?`)) onDelete(inv.id);
                }}
                className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
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
