import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Investment, InvestmentType } from "@/types";

export interface InvestmentWithDerived extends Investment {
  value: number;
  invested: number;
  gain: number;
  gainPct: number;
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  etf: "ETF",
  pac: "PAC",
  azione: "Azioni",
  obbligazione: "Obbligazioni",
  conto_deposito: "Conto Deposito",
  crypto: "Crypto",
  fondo_pensione: "Fondo Pensione",
  liquidita: "Liquidità",
};

export function useInvestments(householdId: string | null) {
  const [investments, setInvestments] = useState<InvestmentWithDerived[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .eq("household_id", householdId)
      .order("name");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Errore caricamento investimenti:", error.message);
      setInvestments([]);
    } else {
      const withDerived = ((data ?? []) as Investment[]).map((inv) => {
        const value = inv.quantity * inv.current_price;
        const invested = inv.quantity * inv.avg_price;
        const gain = value - invested;
        const gainPct = invested ? gain / invested : 0;
        return { ...inv, value, invested, gain, gainPct };
      });
      setInvestments(withDerived);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalValue = investments.reduce((sum, i) => sum + i.value, 0);
  const totalInvested = investments.reduce((sum, i) => sum + i.invested, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = totalInvested ? totalGain / totalInvested : 0;

  async function deleteInvestment(id: string) {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) throw error;
    await refetch();
  }

  return { investments, loading, refetch, totalValue, totalInvested, totalGain, totalGainPct, deleteInvestment };
}
