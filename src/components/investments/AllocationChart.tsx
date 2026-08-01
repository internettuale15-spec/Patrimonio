import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { INVESTMENT_TYPE_LABELS, type InvestmentWithDerived } from "@/hooks/useInvestments";

const PALETTE = [
  "#1F6F54", "#4CA771", "#E8A33D", "#E2603A", "#2C7A8C",
  "#a855f7", "#ec4899", "#84cc16",
];

export function AllocationChart({ investments }: { investments: InvestmentWithDerived[] }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach((inv) => {
      map.set(inv.type, (map.get(inv.type) ?? 0) + inv.value);
    });
    return Array.from(map.entries()).map(([type, value], i) => ({
      type,
      name: INVESTMENT_TYPE_LABELS[type as keyof typeof INVESTMENT_TYPE_LABELS],
      value,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [investments]);

  const total = byType.reduce((sum, d) => sum + d.value, 0);
  const selected = byType.find((d) => d.type === selectedType);

  if (byType.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium mb-3">Allocazione Patrimonio</h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={byType}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            onClick={(d) => setSelectedType(d.type === selectedType ? null : d.type)}
          >
            {byType.map((d) => (
              <Cell
                key={d.type}
                fill={d.color}
                opacity={selectedType && selectedType !== d.type ? 0.35 : 1}
                cursor="pointer"
              />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>
      {selected ? (
        <div className="mt-3 rounded-lg border border-border p-3 flex items-center justify-between text-sm">
          <p className="font-medium" style={{ color: selected.color }}>{selected.name}</p>
          <div className="text-right">
            <p className="font-semibold tabular-nums">{formatCurrency(selected.value)}</p>
            <p className="text-xs text-muted-foreground">{formatPercent(total ? selected.value / total : 0)} del portafoglio</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center mt-2">Tocca una fetta per vedere i dettagli</p>
      )}
    </div>
  );
}
