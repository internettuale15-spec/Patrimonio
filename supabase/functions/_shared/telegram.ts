const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    console.error("Errore invio Telegram:", await res.text());
  }
}
