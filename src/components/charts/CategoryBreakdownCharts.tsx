import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { Tabs } from "@/components/ui/Tabs";
import { formatCurrency, formatPercent } from "@/lib/utils";

export interface CategoryDatum {
  id: string;
  name: string;
  amount: number;
  prevAmount: number;
  color: string;
}

export interface TimeSeriesDatum {
  month: string;
  amount: number;
}

interface Props {
  data: CategoryDatum[];
  timeSeries: TimeSeriesDatum[];
  onSelectionChange?: (name: string | null) => void;
}

export function CategoryBreakdownCharts({ data, timeSeries, onSelectionChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function select(id: string) {
    const next = id === selectedId ? null : id;
    setSelectedId(next);
    onSelectionChange?.(next ? data.find((d) => d.id === next)?.name ?? null : null);
  }

  const total = useMemo(() => data.reduce((sum, d) => sum + d.amount, 0), [data]);
  const selected = data.find((d) => d.id === selectedId) ?? null;

  const detailPanel = selected && (
    <div className="mt-3 rounded-lg border border-border p-3 flex items-center justify-between text-sm">
      <div>
        <p className="font-medium" style={{ color: selected.color }}>{selected.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPercent(total ? selected.amount / total : 0)} del totale
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">{formatCurrency(selected.amount)}</p>
        <p className={`text-xs ${selected.amount >= selected.prevAmount ? "text-danger" : "text-success"}`}>
          {selected.prevAmount === 0
            ? "n/d mese precedente"
            : `${selected.amount >= selected.prevAmount ? "+" : ""}${formatPercent(
                (selected.amount - selected.prevAmount) / selected.prevAmount
              )} vs mese scorso`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Tabs
        tabs={[
          {
            key: "torta",
            label: "Torta",
            content: (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      onClick={(d) => select(d.id)}
                    >
                      {data.map((d) => (
                        <Cell
                          key={d.id}
                          fill={d.color}
                          opacity={selectedId && selectedId !== d.id ? 0.35 : 1}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                {detailPanel ?? (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Tocca una fetta per vedere i dettagli
                  </p>
                )}
              </>
            ),
          },
          {
            key: "barre",
            label: "Barre",
            content: (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar
                    dataKey="amount"
                    radius={[0, 6, 6, 0]}
                    onClick={(d: any) => select(d.id)}
                    cursor="pointer"
                  >
                    {data.map((d) => (
                      <Cell key={d.id} fill={d.color} opacity={selectedId && selectedId !== d.id ? 0.35 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ),
          },
          {
            key: "andamento",
            label: "Andamento",
            content: (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(160 56% 28%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ),
          },
        ]}
      />
    </div>
  );
}
