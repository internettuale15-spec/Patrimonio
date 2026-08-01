import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { LIABILITY_TYPE_LABELS } from "@/hooks/usePatrimonio";
import type { LiabilityType } from "@/types";

export function LiabilityForm({ householdId, onSuccess }: { householdId: string; onSuccess?: () => void }) {
  const [type, setType] = useState<LiabilityType>("mutuo");
  const [name, setName] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!name || !remainingAmount) {
      setErrorMsg("Compila almeno nome e importo residuo.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("liabilities").insert({
        household_id: householdId,
        type,
        name,
        remaining_amount: Number(remainingAmount),
        monthly_payment: monthlyPayment ? Number(monthlyPayment) : null,
        interest_rate: interestRate ? Number(interestRate) : null,
        due_day: dueDay ? Number(dueDay) : null,
      });
      if (error) throw error;
      setName(""); setRemainingAmount(""); setMonthlyPayment(""); setInterestRate(""); setDueDay("");
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
        <Label>Tipo</Label>
        <Select value={type} onChange={(e) => setType(e.target.value as LiabilityType)}>
          {Object.entries(LIABILITY_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Mutuo prima casa" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Importo residuo (€)</Label>
          <Input type="number" step="0.01" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Rata mensile (€)</Label>
          <Input type="number" step="0.01" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Tasso (%)</Label>
          <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Giorno scadenza rata</Label>
          <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </div>
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Salva"}</Button>
    </form>
  );
}
