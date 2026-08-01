import { useState } from "react";
import { Plus, TrendingDown } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryBreakdownCharts } from "@/components/charts/CategoryBreakdownCharts";
import { useMonthlyBreakdown } from "@/hooks/useMonthlyBreakdown";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import type { CategoryKind } from "@/types";

function SpeseSection({ kind, label }: { kind: CategoryKind; label: string }) {
  const { householdId, profile } = useAuthStore();
  const {
    loading, refetch, categoryData, timeSeries, transactionRows, monthTotal, prevMonthTotal, remove,
  } = useMonthlyBreakdown("expenses", householdId, [kind]);
  const [modalOpen, setModalOpen] = useState(false);
  const delta = prevMonthTotal ? (monthTotal - prevMonthTotal) / prevMonthTotal : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StatCard
          label={`${label} — Mese`}
          value={formatCurrency(monthTotal)}
          icon={TrendingDown}
          accent="danger"
          trend={{ value: `${Math.abs(delta * 100).toFixed(0)}%`, positive: delta <= 0 }}
        />
        <Button size="sm" onClick={() => setModalOpen(true)} className="ml-3">
          <Plus size={16} /> Aggiungi
        </Button>
      </div>

      {!loading && categoryData.length > 0 && (
        <CategoryBreakdownCharts data={categoryData} timeSeries={timeSeries} />
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Movimenti del mese</h2>
        <TransactionList rows={transactionRows} emptyLabel={`Nessuna spesa "${label.toLowerCase()}" registrata questo mese.`} onDelete={remove} kind="spesa" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Nuova spesa ${label.toLowerCase()}`}>
        {householdId && profile && (
          <TransactionForm
            householdId={householdId}
            userId={profile.id}
            table="expenses"
            categoryKind={kind}
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

export default function Spese() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Spese</h1>
        <p className="text-sm text-muted-foreground">Spese fisse e variabili del nucleo familiare</p>
      </div>

      <Tabs
        tabs={[
          { key: "fisse", label: "Fisse", content: <SpeseSection kind="spesa_fissa" label="Fisse" /> },
          { key: "variabili", label: "Variabili", content: <SpeseSection kind="spesa_variabile" label="Variabili" /> },
        ]}
      />
    </div>
  );
}
