import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { INVESTMENT_TYPE_LABELS } from "@/hooks/useInvestments";
import type { InvestmentType } from "@/types";

interface InvestmentFormProps {
  householdId: string;
  userId: string;
  onSuccess?: () => void;
}

export function InvestmentForm({ householdId, userId, onSuccess }: InvestmentFormProps) {
  const [type, setType] = useState<InvestmentType>("etf");
  const [name, setName] = useState("");
  const [broker, setBroker] = useState("");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || !quantity || !avgPrice || !currentPrice) {
      setErrorMsg("Compila almeno nome, quantità, prezzo medio e prezzo attuale.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("investments").insert({
        household_id: householdId,
        user_id: userId,
        type,
        name,
        broker: broker || null,
        ticker: ticker || null,
        quantity: Number(quantity),
        avg_price: Number(avgPrice),
        current_price: Number(currentPrice),
        currency: "EUR",
        notes: notes || null,
        created_by: userId,
      });
      if (error) throw error;

      setName(""); setBroker(""); setTicker("");
      setQuantity(""); setAvgPrice(""); setCurrentPrice(""); setNotes("");
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
        <Select value={type} onChange={(e) => setType(e.target.value as InvestmentType)}>
          {Object.entries(INVESTMENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Vanguard FTSE All-World" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Broker</Label>
          <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="es. Directa" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Ticker</Label>
          <Input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="es. VWCE" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Quantità</Label>
          <Input type="number" step="0.000001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Prezzo medio</Label>
          <Input type="number" step="0.0001" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Prezzo attuale</Label>
          <Input type="number" step="0.0001" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Note</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Facoltative" />
      </div>

      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
