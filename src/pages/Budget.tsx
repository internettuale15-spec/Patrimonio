import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetBar } from "@/components/budget/BudgetBar";
import { useBudgets } from "@/hooks/useBudgets";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatPercent } from "@/lib/utils";

const now = new Date();

export default function Budget() {
  const { householdId } = useAuthStore();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { rows, loading, refetch, totalBudget, totalSpent, totalPct, deleteBudget } = useBudgets(householdId, month, year);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Budget</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Imposta budget
        </Button>
      </div>

      <StatCard
        label="Budget Totale Utilizzato"
        value={`${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
        icon={PiggyBank}
        accent={totalPct > 0.9 ? "danger" : "default"}
        trend={{ value: formatPercent(totalPct), positive: totalPct <= 1 }}
      />

      {!loading && (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((row) => (
            <BudgetBar key={row.id} row={row} onDelete={deleteBudget} />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nessun budget impostato per questo mese. Aggiungine uno per categoria per iniziare a monitorare la spesa.
        </p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Imposta budget mensile">
        {householdId && (
          <BudgetForm
            householdId={householdId}
            month={month}
            year={year}
            onSuccess={() => { setModalOpen(false); refetch(); }}
          />
        )}
      </Modal>
    </div>
  );
}
