import { useState } from "react";
import { Plus, LineChart, TrendingUp, TrendingDown, Info } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { InvestmentList } from "@/components/investments/InvestmentList";
import { AllocationChart } from "@/components/investments/AllocationChart";
import { useInvestments } from "@/hooks/useInvestments";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function Investimenti() {
  const { householdId, profile } = useAuthStore();
  const { investments, loading, refetch, totalValue, totalGain, totalGainPct, deleteInvestment } = useInvestments(householdId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Investimenti</h1>
          <p className="text-sm text-muted-foreground">ETF, PAC, azioni, obbligazioni, crypto e altro</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Aggiungi
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Valore Totale" value={formatCurrency(totalValue)} icon={LineChart} />
        <StatCard
          label="Gain/Loss Totale"
          value={`${totalGain >= 0 ? "+" : ""}${formatCurrency(totalGain)}`}
          icon={totalGain >= 0 ? TrendingUp : TrendingDown}
          accent={totalGain >= 0 ? "success" : "danger"}
          trend={{ value: formatPercent(Math.abs(totalGainPct)), positive: totalGain >= 0 }}
        />
      </div>

      {!loading && <AllocationChart investments={investments} />}

      <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Il grafico "Evoluzione Investimenti" richiede uno storico prezzi
          (tabella <code>investment_snapshots</code>): da popolare con un
          aggiornamento giornaliero automatico (Edge Function + API prezzi),
          nella roadmap Automazioni.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Portafoglio</h2>
        <InvestmentList investments={investments} onDelete={deleteInvestment} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo investimento">
        {householdId && profile && (
          <InvestmentForm
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
