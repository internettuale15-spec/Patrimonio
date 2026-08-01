// Supabase Edge Function — da schedulare 1 volta al giorno (vedi README).
// Per ogni household con scadenze in arrivo (entro notify_days_before) o scadute
// e non pagate, manda un messaggio Telegram a tutti i profili collegati.

import { getServiceClient } from "../_shared/supabaseClient.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

Deno.serve(async () => {
  const supabase = getServiceClient();

  const { data: deadlines, error } = await supabase
    .from("deadlines")
    .select("id, household_id, title, amount, due_date, notify_days_before")
    .eq("is_paid", false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const toNotify = (deadlines ?? []).filter((d) => {
    const days = daysUntil(d.due_date);
    return days <= (d.notify_days_before ?? 3);
  });

  const byHousehold = new Map<string, typeof toNotify>();
  for (const d of toNotify) {
    const list = byHousehold.get(d.household_id) ?? [];
    list.push(d);
    byHousehold.set(d.household_id, list);
  }

  let sent = 0;
  for (const [householdId, items] of byHousehold) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("household_id", householdId)
      .not("telegram_chat_id", "is", null);

    if (!profiles || profiles.length === 0) continue;

    const lines = items.map((d) => {
      const days = daysUntil(d.due_date);
      const when = days < 0 ? `scaduta da ${Math.abs(days)}g` : days === 0 ? "oggi" : `tra ${days}g`;
      const amountStr = d.amount ? ` — ${Number(d.amount).toFixed(2)}€` : "";
      return `• <b>${d.title}</b>${amountStr} (${when})`;
    });
    const text = `🔔 Scadenze in arrivo:\n\n${lines.join("\n")}`;

    for (const p of profiles) {
      if (p.telegram_chat_id) {
        await sendTelegramMessage(p.telegram_chat_id, text);
        sent++;
      }
    }
  }

  return new Response(JSON.stringify({ households: byHousehold.size, messagesSent: sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
