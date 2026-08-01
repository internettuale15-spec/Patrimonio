import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useInvestments } from "@/hooks/useInvestments";
import type { Asset, Liability, AssetType, LiabilityType } from "@/types";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  conto_corrente: "Conto Corrente",
  contanti: "Contanti",
  casa: "Casa",
  auto: "Auto",
  altro_bene: "Altri Beni",
};

export const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  mutuo: "Mutuo",
  prestito: "Prestito",
  carta: "Carta di Credito",
  finanziamento: "Finanziamento",
};

interface NetWorthSnapshot {
  date: string;
  net_worth: number;
}

export function usePatrimonio(householdId: string | null) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const { totalValue: investmentsValue, loading: loadingInvestments } = useInvestments(householdId);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const [assetsRes, liabilitiesRes, snapshotsRes] = await Promise.all([
      supabase.from("assets").select("*").eq("household_id", householdId).order("value", { ascending: false }),
      supabase.from("liabilities").select("*").eq("household_id", householdId).order("remaining_amount", { ascending: false }),
      supabase.from("net_worth_snapshots").select("date, net_worth").eq("household_id", householdId).order("date"),
    ]);
    setAssets((assetsRes.data ?? []) as Asset[]);
    setLiabilities((liabilitiesRes.data ?? []) as Liability[]);
    setSnapshots((snapshotsRes.data ?? []) as NetWorthSnapshot[]);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const liquidAssets = assets.filter((a) => a.type === "conto_corrente" || a.type === "contanti");
  const liquidity = liquidAssets.reduce((sum, a) => sum + a.value, 0);
  const otherAssetsValue = assets.reduce((sum, a) => sum + a.value, 0);

  const totalAssets = otherAssetsValue + investmentsValue;
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remaining_amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const saveSnapshot = useCallback(async () => {
    if (!householdId) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("net_worth_snapshots").upsert(
      {
        household_id: householdId,
        date: today,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
        liquidity,
        investments_value: investmentsValue,
      },
      { onConflict: "household_id,date" }
    );
    if (error) throw error;
    refetch();
  }, [householdId, totalAssets, totalLiabilities, netWorth, liquidity, investmentsValue, refetch]);

  return {
    assets, liabilities, snapshots,
    loading: loading || loadingInvestments,
    refetch, saveSnapshot,
    liquidity, investmentsValue, totalAssets, totalLiabilities, netWorth,
    async deleteAsset(id: string) {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    async deleteLiability(id: string) {
      const { error } = await supabase.from("liabilities").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
  };
}
