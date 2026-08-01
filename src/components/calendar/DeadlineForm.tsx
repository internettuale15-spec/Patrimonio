import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Mutuo", "Bolletta", "Assicurazione", "PAC", "Abbonamento", "Altro"];

export function DeadlineForm({ householdId, onSuccess }: { householdId: string; onSuccess?: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notifyDaysBefore, setNotifyDaysBefore] = useState("3");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!title || !dueDate) {
      setErrorMsg("Compila almeno titolo e data.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("deadlines").insert({
        household_id: householdId,
        title,
        category,
        amount: amount ? Number(amount) : null,
        due_date: dueDate,
        notify_days_before: Number(notifyDaysBefore) || 3,
      });
      if (error) throw error;
      setTitle(""); setAmount("");
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label>Titolo</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="es. Rata mutuo luglio" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Categoria</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Importo (€, facoltativo)</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Data scadenza</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Notifica (giorni prima)</Label>
          <Input type="number" min={0} value={notifyDaysBefore} onChange={(e) => setNotifyDaysBefore(e.target.value)} />
        </div>
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Salva"}</Button>
    </form>
  );
}
