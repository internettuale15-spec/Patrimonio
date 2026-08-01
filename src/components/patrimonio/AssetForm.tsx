import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { ASSET_TYPE_LABELS } from "@/hooks/usePatrimonio";
import type { AssetType } from "@/types";

export function AssetForm({ householdId, onSuccess }: { householdId: string; onSuccess?: () => void }) {
  const [type, setType] = useState<AssetType>("conto_corrente");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!name || !value) {
      setErrorMsg("Compila nome e valore.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("assets").insert({
        household_id: householdId, type, name, value: Number(value),
      });
      if (error) throw error;
      setName(""); setValue("");
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
        <Select value={type} onChange={(e) => setType(e.target.value as AssetType)}>
          {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Conto Corrente Intesa" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Valore (€)</Label>
        <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio..." : "Salva"}</Button>
    </form>
  );
}
