// Supabase Edge Function — riceve i messaggi del bot Telegram (webhook).
// Gestisce due casi:
//  1. "/collega CODICE" (o "/start CODICE") — collega il chat Telegram al profilo
//  2. Qualsiasi altro testo — lo interpreta come un movimento da registrare,
//     es. "assicurazione auto 250" (spesa) o "entrata stipendio 1850"

import { getServiceClient } from "../_shared/supabaseClient.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

function parseAmountAndDescription(text: string): { amount: number; description: string } | null {
  // Cerca l'ultimo numero nel testo (accetta virgola o punto come decimale)
  const matches = [...text.matchAll(/(\d+(?:[.,]\d{1,2})?)/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const amount = Number(last[1].replace(",", "."));
  if (!amount || amount <= 0) return null;
  const description = (text.slice(0, last.index) + text.slice((last.index ?? 0) + last[0].length))
    .replace(/\b(entrata|spesa)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { amount, description: description || "Da Telegram" };
}

Deno.serve(async (req) => {
  try {
    const update = await req.json();
    const message = update.message;
    if (!message?.text || !message?.chat?.id) {
      return new Response("ok");
    }

    const chatId: number = message.chat.id;
    const text: string = message.text.trim();
    const supabase = getServiceClient();

    // --- Collegamento account ---
    const linkMatch = text.match(/^\/(?:start|collega)\s+(\S+)/i);
    if (linkMatch) {
      const code = linkMatch[1].toUpperCase();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("telegram_link_code", code)
        .maybeSingle();

      if (error || !profile) {
        await sendTelegramMessage(chatId, "❌ Codice non valido o scaduto. Generane uno nuovo dalle Impostazioni dell'app.");
        return new Response("ok");
      }

      await supabase
        .from("profiles")
        .update({ telegram_chat_id: chatId, telegram_link_code: null })
        .eq("id", profile.id);

      await sendTelegramMessage(
        chatId,
        `✅ Collegato, ${profile.full_name}!\n\nDa ora puoi scrivermi per registrare un movimento, ad esempio:\n<code>assicurazione auto 250</code> → spesa\n<code>entrata stipendio 1850</code> → entrata`
      );
      return new Response("ok");
    }

    // --- Trova il profilo collegato a questo chat ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, household_id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (!profile) {
      await sendTelegramMessage(
        chatId,
        "Non ti riconosco ancora. Vai in Impostazioni nell'app, genera un codice, e scrivimi:\n<code>/collega CODICE</code>"
      );
      return new Response("ok");
    }

    // --- Interpreta il messaggio come movimento ---
    const parsed = parseAmountAndDescription(text);
    if (!parsed) {
      await sendTelegramMessage(chatId, "Non ho capito l'importo. Scrivimi ad esempio: <code>spesa auto 250</code>");
      return new Response("ok");
    }

    const isIncome = /^entrata\b/i.test(text);
    const table = isIncome ? "incomes" : "expenses";

    // Prova ad abbinare una categoria per parola chiave nel testo
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, kind")
      .eq("household_id", profile.household_id)
      .eq("kind", isIncome ? "entrata" : "spesa_variabile");

    const lowerText = parsed.description.toLowerCase();
    const matchedCategory = (categories ?? []).find((c) => lowerText.includes(c.name.toLowerCase()));

    const today = new Date().toISOString().slice(0, 10);
    const { error: insertError } = await supabase.from(table).insert({
      household_id: profile.household_id,
      category_id: matchedCategory?.id ?? null,
      amount: parsed.amount,
      date: today,
      description: parsed.description,
      user_id: profile.id,
      created_by: profile.id,
    });

    if (insertError) {
      await sendTelegramMessage(chatId, `❌ Errore nel salvataggio: ${insertError.message}`);
      return new Response("ok");
    }

    const label = isIncome ? "Entrata" : "Spesa";
    const catNote = matchedCategory ? ` (${matchedCategory.name})` : "";
    await sendTelegramMessage(
      chatId,
      `✅ ${label} registrata: ${parsed.amount.toFixed(2)}€ — ${parsed.description}${catNote}`
    );

    return new Response("ok");
  } catch (err) {
    console.error(err);
    return new Response("ok"); // rispondere sempre 200 a Telegram, altrimenti ritenta
  }
});
