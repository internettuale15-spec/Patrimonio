import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ASSET_TYPE_LABELS, LIABILITY_TYPE_LABELS } from "@/hooks/usePatrimonio";
import type { Asset, Liability } from "@/types";

export function AssetList({ assets, onDelete }: { assets: Asset[]; onDelete?: (id: string) => void }) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nessuna attività registrata.</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {assets.map((a) => (
        <div key={a.id} className="flex items-center justify-between py-2.5 text-sm group">
          <div>
            <p className="font-medium">{a.name}</p>
            <p className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[a.type]}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums font-medium text-success">{formatCurrency(a.value)}</span>
            {onDelete && (
              <button
                onClick={() => { if (confirm(`Eliminare "${a.name}"?`)) onDelete(a.id); }}
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

export function LiabilityList({ liabilities, onDelete }: { liabilities: Liability[]; onDelete?: (id: string) => void }) {
  if (liabilities.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nessuna passività registrata.</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {liabilities.map((l) => (
        <div key={l.id} className="flex items-center justify-between py-2.5 text-sm group">
          <div>
            <p className="font-medium">{l.name}</p>
            <p className="text-xs text-muted-foreground">
              {LIABILITY_TYPE_LABELS[l.type]}
              {l.monthly_payment ? ` · rata ${formatCurrency(l.monthly_payment)}/mese` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums font-medium text-danger">{formatCurrency(l.remaining_amount)}</span>
            {onDelete && (
              <button
                onClick={() => { if (confirm(`Eliminare "${l.name}"?`)) onDelete(l.id); }}
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
