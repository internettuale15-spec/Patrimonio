import { useState } from "react";
import { Label, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/store/authStore";

function LoginForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Errore di accesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Accesso..." : "Accedi"}</Button>
    </form>
  );
}

function SignupForm() {
  const signUp = useAuthStore((s) => s.signUp);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdCode, setHouseholdCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setConfirmationMsg(null);
    if (!fullName || !email || !password) {
      setErrorMsg("Compila nome, email e password.");
      return;
    }
    setSaving(true);
    try {
      const result = await signUp({ email, password, fullName, householdCode: householdCode || undefined });
      if (result.needsEmailConfirmation) {
        setConfirmationMsg("Controlla la tua email per confermare l'account, poi torna qui e accedi.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Errore durante la registrazione.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>Nome</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="es. Mirco" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Codice famiglia (facoltativo)</Label>
        <Input
          value={householdCode}
          onChange={(e) => setHouseholdCode(e.target.value)}
          placeholder="Incolla qui il codice se ti unisci a un household esistente"
        />
        <p className="text-[11px] text-muted-foreground">
          Lascia vuoto per creare un nuovo nucleo familiare. Il primo utente
          (es. Mirco) lo crea, poi condivide il codice (visibile in Impostazioni)
          con il secondo utente (es. Debora) che lo incolla qui.
        </p>
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      {confirmationMsg && <p className="text-xs text-success">{confirmationMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Registrazione..." : "Crea account"}</Button>
    </form>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <div className="text-center mb-6">
          <span className="text-2xl">💼</span>
          <h1 className="text-lg font-semibold mt-2">Family Wealth Manager</h1>
          <p className="text-sm text-muted-foreground">Gestionale del patrimonio familiare</p>
        </div>
        <Tabs
          tabs={[
            { key: "login", label: "Accedi", content: <LoginForm /> },
            { key: "signup", label: "Registrati", content: <SignupForm /> },
          ]}
        />
      </div>
    </div>
  );
}
