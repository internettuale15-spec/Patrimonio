import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useCategories } from "@/hooks/useCategories";

interface BudgetFormProps {
  householdId: string;
  month: number;
  year: number;
  onSuccess?: () => void;
}

export function BudgetForm({ householdId, month, year, onSuccess }: BudgetFormProps) {
  const { categories: fisse } = useCategories(householdId, "spesa_fissa");
  const { categories: variabili } = useCategories(householdId, "spesa_variabile");
  const categories = [...fisse, ...variabili];

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!categoryId || !amount) {
      setErrorMsg("Seleziona categoria e importo.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("budgets").upsert(
        {
          household_id: householdId,
          category_id: categoryId,
          month,
          year,
          amount: Number(amount),
        },
        { onConflict: "household_id,category_id,month,year" }
      );
      if (error) throw error;
      setCategoryId(""); setAmount("");
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
        <Label>Categoria</Label>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Seleziona categoria...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Budget mensile (€)</Label>
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Salva"}</Button>
    </form>
  );
}
