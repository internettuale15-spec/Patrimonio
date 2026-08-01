import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyTotal } from "@/hooks/useAnnualReport";

export function MonthlyIncomeExpenseChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="entrate" name="Entrate" fill="hsl(144 37% 48%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spese" name="Spese" fill="hsl(14 74% 56%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
