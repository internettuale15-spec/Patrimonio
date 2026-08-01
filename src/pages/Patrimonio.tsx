import { useState } from "react";
import { Plus, Wallet, Landmark, TrendingDown, Save } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { AssetForm } from "@/components/patrimonio/AssetForm";
import { LiabilityForm } from "@/components/patrimonio/LiabilityForm";
import { AssetList, LiabilityList } from "@/components/patrimonio/AssetLiabilityList";
import { usePatrimonio } from "@/hooks/usePatrimonio";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";

export default function Patrimonio() {
  const { householdId } = useAuthStore();
  const {
    assets, liabilities, snapshots, loading, refetch, saveSnapshot,
    liquidity, investmentsValue, totalAssets, totalLiabilities, netWorth,
    deleteAsset, deleteLiability,
  } = usePatrimonio(householdId);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [liabilityModalOpen, setLiabilityModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSaveSnapshot() {
    setSaving(true);
    try {
      await saveSnapshot();
    } finally {
      setSaving(false);
    }
  }

  const chartData = snapshots.map((s) => ({
    date: new Date(s.date).toLocaleDateString("it-IT", { month: "short", day: "numeric" }),
    value: s.net_worth,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Patrimonio</h1>
          <p className="text-sm text-muted-foreground">Attività, passività e patrimonio netto</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSaveSnapshot} disabled={saving || loading}>
          <Save size={16} /> {saving ? "Salvataggio..." : "Salva snapshot oggi"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Patrimonio Netto" value={formatCurrency(netWorth)} icon={Wallet} />
        <StatCard label="Totale Attività" value={formatCurrency(totalAssets)} icon={Landmark} accent="success" />
        <StatCard label="Totale Passività" value={formatCurrency(totalLiabilities)} icon={TrendingDown} accent="danger" />
        <StatCard label="Liquidità" value={formatCurrency(liquidity)} icon={Landmark} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Storico Patrimonio Netto</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 56% 28%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160 56% 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="value" stroke="hsl(160 56% 28%)" fill="url(#pnGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">
            Ancora nessuno snapshot. Tocca "Salva snapshot oggi" per iniziare a costruire lo storico
            (consigliato: farlo automaticamente ogni giorno con una Edge Function).
          </p>
        )}
      </div>

      <Tabs
        tabs={[
          {
            key: "attivita",
            label: "Attività",
            content: (
              <div className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setAssetModalOpen(true)}>
                    <Plus size={16} /> Nuova attività
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    ETF, azioni e altri strumenti finanziari arrivano dalla sezione Investimenti
                    ({formatCurrency(investmentsValue)}) e sono già inclusi nel totale attività.
                  </p>
                  <AssetList assets={assets} onDelete={deleteAsset} />
                </div>
              </div>
            ),
          },
          {
            key: "passivita",
            label: "Passività",
            content: (
              <div className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setLiabilityModalOpen(true)}>
                    <Plus size={16} /> Nuova passività
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <LiabilityList liabilities={liabilities} onDelete={deleteLiability} />
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal open={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Nuova attività">
        {householdId && (
          <AssetForm householdId={householdId} onSuccess={() => { setAssetModalOpen(false); refetch(); }} />
        )}
      </Modal>

      <Modal open={liabilityModalOpen} onClose={() => setLiabilityModalOpen(false)} title="Nuova passività">
        {householdId && (
          <LiabilityForm householdId={householdId} onSuccess={() => { setLiabilityModalOpen(false); refetch(); }} />
        )}
      </Modal>
    </div>
  );
}
