import { useState } from "react";
import { Label, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

const COLORS = ["#1F6F54", "#4CA771", "#E8A33D", "#E2603A", "#2C7A8C", "#B23A2E"];

export function GoalForm({ householdId, onSuccess }: { householdId: string; onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!name || !targetAmount) {
      setErrorMsg("Compila nome e importo target.");
      return;
    }
    setSaving(true);
    try {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const { error } = await supabase.from("goals").insert({
        household_id: householdId,
        name,
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount) || 0,
        target_date: targetDate || null,
        color,
      });
      if (error) throw error;
      setName(""); setTargetAmount(""); setCurrentAmount("0"); setTargetDate("");
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
        <Label>Nome obiettivo</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Fondo Emergenza" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Importo target (€)</Label>
          <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Importo già accumulato (€)</Label>
          <Input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Data prevista (facoltativa)</Label>
        <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Crea obiettivo"}</Button>
    </form>
  );
}
