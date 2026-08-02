import { useState } from "react";
import { Copy, Check, Send, Bell, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

const BOT_USERNAME = "Pat_Bot";

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // esclude caratteri ambigui
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const EXAMPLES = [
  { text: "spesa auto 250", note: "registra una spesa di 250€" },
  { text: "assicurazione casa 480", note: "spesa — la categoria viene riconosciuta dal nome se combacia" },
  { text: "entrata stipendio 1850", note: "registra un'entrata di 1850€" },
];

export default function Telegram() {
  const { profile, loadProfile } = useAuthStore();
  const [linkCode, setLinkCode] = useState(profile?.telegram_link_code ?? null);
  const [generating, setGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const isConnected = !!profile?.telegram_chat_id;

  async function handleGenerateCode() {
    if (!profile) return;
    setGenerating(true);
    const code = generateCode();
    const { error } = await supabase
      .from("profiles")
      .update({ telegram_link_code: code })
      .eq("id", profile.id);
    if (!error) {
      setLinkCode(code);
      await loadProfile(profile.id);
    }
    setGenerating(false);
  }

  function handleCopyCode() {
    if (!linkCode) return;
    navigator.clipboard.writeText(`/collega ${linkCode}`);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Send size={20} className="text-primary" /> Telegram
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra spese ed entrate scrivendo un messaggio, ricevi i promemoria delle scadenze.
        </p>
      </div>

      {/* Stato collegamento */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Stato collegamento</span>
          {isConnected ? (
            <span className="text-xs bg-income/10 text-income px-2.5 py-1 rounded-full font-medium">✓ Collegato</span>
          ) : (
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">Non collegato</span>
          )}
        </div>

        <a
          href={`https://t.me/${BOT_USERNAME}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm hover:bg-muted/70 transition-colors"
        >
          <span className="font-medium">@{BOT_USERNAME}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Apri su Telegram <ExternalLink size={12} />
          </span>
        </a>

        {isConnected ? (
          <p className="text-sm text-muted-foreground">
            Il tuo account Telegram è collegato a questo profilo. Puoi scrivere al bot in
            qualsiasi momento per registrare un movimento.
          </p>
        ) : linkCode ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Cerca <strong>@{BOT_USERNAME}</strong> su Telegram (o clicca sopra), apri la chat e incolla questo messaggio:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-base bg-muted rounded-xl px-4 py-3 text-center font-display font-semibold tracking-wider">
                /collega {linkCode}
              </code>
              <Button variant="outline" onClick={handleCopyCode}>
                {codeCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleGenerateCode} disabled={generating} className="self-start text-muted-foreground">
              {generating ? "..." : "Genera un nuovo codice"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Genera un codice, poi scrivilo al bot per collegare questo profilo.
            </p>
            <Button onClick={handleGenerateCode} disabled={generating} className="self-start">
              {generating ? "..." : "Genera codice"}
            </Button>
          </div>
        )}
      </div>

      {/* Come si usa */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
        <span className="font-medium flex items-center gap-2">
          <MessageCircle size={16} className="text-investment" /> Come registrare un movimento
        </span>
        <p className="text-sm text-muted-foreground">
          Scrivi al bot in linguaggio naturale, con l'importo alla fine — riconosce automaticamente
          la categoria se il nome combacia con una delle tue categorie.
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <div key={ex.text} className="flex items-center justify-between text-sm bg-muted rounded-xl px-3 py-2">
              <code className="font-medium">{ex.text}</code>
              <span className="text-xs text-muted-foreground">{ex.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Promemoria */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        <span className="font-medium flex items-center gap-2">
          <Bell size={16} className="text-goal" /> Promemoria scadenze
        </span>
        <p className="text-sm text-muted-foreground">
          Una volta collegato, ricevi automaticamente un messaggio quando una scadenza in
          "Calendario" si avvicina, senza doverla controllare a mano nell'app.
        </p>
      </div>
    </div>
  );
}
