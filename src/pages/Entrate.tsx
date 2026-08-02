import { useState } from "react";
import { Plus, TrendingUp, X } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryBreakdownCharts } from "@/components/charts/CategoryBreakdownCharts";
import { useMonthlyBreakdown } from "@/hooks/useMonthlyBreakdown";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";

export default function Entrate() {
  const { householdId, profile } = useAuthStore();
  const {
    loading, refetch, categoryData, timeSeries, transactionRows, monthTotal, prevMonthTotal, yearTotal, remove,
  } = useMonthlyBreakdown("incomes", householdId);
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
          <h1 className="text-xl font-semibold">Entrate</h1>
          <p className="text-sm text-muted-foreground">Stipendi, bonus, rimborsi e altre entrate</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuova entrata
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Entrate Mese"
          value={formatCurrency(monthTotal)}
          icon={TrendingUp}
          accent="success"
          trend={{ value: `${Math.abs(delta * 100).toFixed(0)}%`, positive: delta >= 0 }}
        />
        <StatCard label="Mese Precedente" value={formatCurrency(prevMonthTotal)} icon={TrendingUp} />
        <StatCard label="Totale Anno" value={formatCurrency(yearTotal)} icon={TrendingUp} accent="success" />
      </div>

      {!loading && categoryData.length > 0 && (
        <CategoryBreakdownCharts data={categoryData} timeSeries={timeSeries} onSelectionChange={setFilterCategory} />
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Movimenti del mese</h2>
          {filterCategory && (
            <button
              onClick={() => setFilterCategory(null)}
              className="flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
            >
              {filterCategory} <X size={12} />
            </button>
          )}
        </div>
        <TransactionList rows={visibleRows} emptyLabel="Nessuna entrata registrata questo mese." onDelete={remove} kind="entrata" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova entrata">
        {householdId && profile && (
          <TransactionForm
            householdId={householdId}
            userId={profile.id}
            table="incomes"
            categoryKind="entrata"
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
