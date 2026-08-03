import { formatCurrency } from "@/lib/utils";
import { Paperclip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
  categoryName: string;
  attachmentUrl?: string | null;
}

const DOT_COLOR = {
  entrata: "bg-income",
  spesa: "bg-expense",
  casa: "bg-goal",
};

export function TransactionList({
  rows, emptyLabel, onDelete, kind = "spesa",
}: {
  rows: TransactionRow[];
  emptyLabel: string;
  onDelete?: (id: string) => void;
  kind?: "entrata" | "spesa" | "casa";
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-2.5 text-sm group">
          <div className="flex items-center gap-2.5">
            <span className={cn("w-2 h-2 rounded-full shrink-0", DOT_COLOR[kind])} />
            <div className="flex flex-col">
              <span className="font-medium">{r.categoryName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(r.date).toLocaleDateString("it-IT")}
                {r.description ? ` · ${r.description}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {r.attachmentUrl && (
              <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className="text-muted-foreground">
                <Paperclip size={14} />
              </a>
            )}
            <span className="tabular-nums">{formatCurrency(r.amount)}</span>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("Eliminare questo movimento?")) onDelete(r.id);
                }}
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
