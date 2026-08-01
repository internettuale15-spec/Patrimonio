import { useState } from "react";
import { Copy, Check, LogOut, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // esclude caratteri ambigui
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function Impostazioni() {
  const { profile, householdId, signOut, loadProfile } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState(profile?.telegram_link_code ?? null);
  const [generating, setGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  function handleCopy() {
    if (!householdId) return;
    navigator.clipboard.writeText(householdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const isConnected = !!profile?.telegram_chat_id;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold">Impostazioni</h1>
        <p className="text-sm text-muted-foreground">Account e condivisione con il nucleo familiare</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Nome</p>
        <p className="font-medium">{profile?.full_name}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Codice famiglia</p>
          <p className="text-xs text-muted-foreground">
            Condividi questo codice con l'altra persona: incollandolo in fase di
            registrazione entrerà a far parte dello stesso nucleo familiare e
            vedrà tutti gli stessi dati in tempo reale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 break-all">{householdId}</code>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Send size={14} /> Telegram
          </p>
          {isConnected && <span className="text-xs text-income font-medium">✓ Collegato</span>}
        </div>

        {isConnected ? (
          <p className="text-xs text-muted-foreground">
            Puoi scrivere al bot per registrare spese ed entrate al volo, e riceverai
            un promemoria automatico per le scadenze in arrivo.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Collega Telegram per registrare movimenti scrivendo un messaggio (es.
              "spesa auto 250") e ricevere i promemoria delle scadenze.
            </p>
            {linkCode ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 text-center font-display font-semibold tracking-wider">
                    /collega {linkCode}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopyCode}>
                    {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Apri la chat con il bot su Telegram e incolla questo messaggio.
                </p>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={handleGenerateCode} disabled={generating} className="self-start">
                {generating ? "..." : "Genera codice"}
              </Button>
            )}
          </>
        )}
      </div>

      <Button variant="outline" onClick={signOut} className="self-start">
        <LogOut size={16} /> Esci
      </Button>
    </div>
  );
}
