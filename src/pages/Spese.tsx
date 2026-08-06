import { useMemo, useState } from "react";
import { Plus, TrendingDown, X } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MonthNavigator } from "@/components/ui/MonthNavigator";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryBreakdownCharts } from "@/components/charts/CategoryBreakdownCharts";
import { useMonthlyBreakdown } from "@/hooks/useMonthlyBreakdown";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";

const EXPENSE_KINDS = ["spesa_fissa", "spesa_variabile"] as const;

export default function Spese() {
  const { householdId, profile } = useAuthStore();
  const [viewDate, setViewDate] = useState(new Date());
  const kindFilter = useMemo(() => [...EXPENSE_KINDS], []);
  const {
    loading, refetch, categoryData, timeSeries, transactionRows, monthTotal, prevMonthTotal, remove,
  } = useMonthlyBreakdown("expenses", householdId, kindFilter, viewDate);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const delta = prevMonthTotal ? (monthTotal - prevMonthTotal) / prevMonthTotal : 0;
  const visibleRows = filterCategory
    ? transactionRows.filter((r) => r.categoryName === filterCategory)
    : transactionRows;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Spese</h1>
          <p className="text-sm text-muted-foreground">Tutte le spese del nucleo familiare</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Aggiungi
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Spese Mese"
          value={formatCurrency(monthTotal)}
          icon={TrendingDown}
          accent="danger"
          trend={{ value: `${Math.abs(delta * 100).toFixed(0)}%`, positive: delta <= 0 }}
        />
        <StatCard label="Mese Precedente" value={formatCurrency(prevMonthTotal)} icon={TrendingDown} />
      </div>

      {!loading && categoryData.length > 0 && (
        <CategoryBreakdownCharts data={categoryData} timeSeries={timeSeries} onSelectionChange={setFilterCategory} />
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Movimenti</h2>
          <div className="flex items-center gap-3">
            {filterCategory && (
              <button
                onClick={() => setFilterCategory(null)}
                className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
              >
                {filterCategory} <X size={12} />
              </button>
            )}
            <MonthNavigator viewDate={viewDate} onChange={setViewDate} />
          </div>
        </div>
        <TransactionList rows={visibleRows} emptyLabel="Nessuna spesa registrata in questo mese." onDelete={remove} kind="spesa" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova spesa">
        {householdId && profile && (
          <TransactionForm
            householdId={householdId}
            userId={profile.id}
            table="expenses"
            categoryKind={kindFilter}
            allowAttachment
            onSuccess={() => {
              setModalOpen(false);
              refetch();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
