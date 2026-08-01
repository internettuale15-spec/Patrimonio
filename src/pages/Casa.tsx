import { useState } from "react";
import { Plus, Home as HomeIcon, Info } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CasaForm } from "@/components/transactions/CasaForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryBreakdownCharts } from "@/components/charts/CategoryBreakdownCharts";
import { useMonthlyBreakdown } from "@/hooks/useMonthlyBreakdown";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";

export default function Casa() {
  const { householdId, profile } = useAuthStore();
  const {
    loading, refetch, categoryData, timeSeries, transactionRows, monthTotal, yearTotal, remove,
  } = useMonthlyBreakdown("home_expenses", householdId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Casa</h1>
          <p className="text-sm text-muted-foreground">Mobili, elettrodomestici, manutenzione, condominio...</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuova spesa
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Ogni spesa inserita qui viene registrata automaticamente anche nella
          sezione Spese (categoria "Casa"): non serve inserirla due volte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Spese Casa — Mese" value={formatCurrency(monthTotal)} icon={HomeIcon} accent="danger" />
        <StatCard label="Spese Casa — Anno" value={formatCurrency(yearTotal)} icon={HomeIcon} accent="danger" />
      </div>

      {!loading && categoryData.length > 0 && (
        <CategoryBreakdownCharts data={categoryData} timeSeries={timeSeries} />
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Movimenti del mese</h2>
        <TransactionList rows={transactionRows} emptyLabel="Nessuna spesa casa registrata questo mese." onDelete={remove} kind="casa" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuova spesa Casa">
        {householdId && profile && (
          <CasaForm
            householdId={householdId}
            userId={profile.id}
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
