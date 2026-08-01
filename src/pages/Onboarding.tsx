import { useState } from "react";
import { Label, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { createProfileForUser, useAuthStore } from "@/store/authStore";

export default function Onboarding() {
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [fullName, setFullName] = useState("");
  const [householdCode, setHouseholdCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName) {
      setErrorMsg("Inserisci il tuo nome.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      console.log("DEBUG access_token presente:", !!data.session?.access_token);
      const userId = data.session?.user.id;
      if (!userId) throw new Error("Sessione non trovata, riprova ad accedere.");
      await createProfileForUser(userId, fullName, householdCode || undefined);
      await loadProfile(userId);
    } catch (err: any) {
      console.error(
        "DEBUG errore completo onboarding:",
        JSON.stringify(
          { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint, status: err?.status },
          null,
          2
        )
      );
      setErrorMsg(err instanceof Error ? err.message : "Errore durante la creazione del profilo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <h1 className="text-lg font-semibold mb-1">Completa il profilo</h1>
        <p className="text-sm text-muted-foreground mb-4">Ultimo passo prima di iniziare.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Nome</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="es. Debora" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Codice famiglia (facoltativo)</Label>
            <Input
              value={householdCode}
              onChange={(e) => setHouseholdCode(e.target.value)}
              placeholder="Incolla il codice se ti unisci a un household esistente"
            />
          </div>
          {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Continua"}</Button>
        </form>
      </div>
    </div>
  );
}
