// Supabase Edge Function — da schedulare giornalmente (vedi README per il cron).
// Per ogni household calcola attività/passività/patrimonio netto e fa upsert
// in net_worth_snapshots per la data odierna.

import { getServiceClient } from "../_shared/supabaseClient.ts";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const supabase = getServiceClient();
  const today = toISODate(new Date());

  const { data: households, error } = await supabase.from("households").select("id");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: Record<string, string> = {};

  for (const household of households ?? []) {
    try {
      const [assetsRes, liabilitiesRes, investmentsRes] = await Promise.all([
        supabase.from("assets").select("type, value").eq("household_id", household.id),
        supabase.from("liabilities").select("remaining_amount").eq("household_id", household.id),
        supabase.from("investments").select("quantity, current_price").eq("household_id", household.id),
      ]);

      const assets = assetsRes.data ?? [];
      const liabilities = liabilitiesRes.data ?? [];
      const investments = investmentsRes.data ?? [];

      const liquidity = assets
        .filter((a) => a.type === "conto_corrente" || a.type === "contanti")
        .reduce((sum, a) => sum + Number(a.value), 0);

      const investmentsValue = investments.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.current_price),
        0
      );

      const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0) + investmentsValue;
      const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.remaining_amount), 0);
      const netWorth = totalAssets - totalLiabilities;

      const { error: upsertError } = await supabase.from("net_worth_snapshots").upsert(
        {
          household_id: household.id,
          date: today,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          liquidity,
          investments_value: investmentsValue,
        },
        { onConflict: "household_id,date" }
      );
      if (upsertError) throw upsertError;

      results[household.id] = `snapshot salvato: patrimonio netto ${netWorth.toFixed(2)}`;
    } catch (err) {
      results[household.id] = `errore: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return new Response(JSON.stringify({ processed: households?.length ?? 0, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
