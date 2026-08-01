import { useState } from "react";
import { Copy, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export default function Impostazioni() {
  const { profile, householdId, signOut } = useAuthStore();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!householdId) return;
    navigator.clipboard.writeText(householdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

      <Button variant="outline" onClick={signOut} className="self-start">
        <LogOut size={16} /> Esci
      </Button>
    </div>
  );
}
