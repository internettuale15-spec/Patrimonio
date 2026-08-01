import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/lib/supabase";

interface CasaFormProps {
  householdId: string;
  userId: string;
  onSuccess?: () => void;
}

export function CasaForm({ householdId, userId, onSuccess }: CasaFormProps) {
  const { categories, loading: loadingCategories } = useCategories(householdId, "casa");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!categoryId || !amount || !date) {
      setErrorMsg("Compila categoria, importo e data.");
      return;
    }

    setSaving(true);
    try {
      let attachmentUrl: string | null = null;
      if (attachment) {
        const path = `${householdId}/${Date.now()}-${attachment.name}`;
        const { error: uploadError } = await supabase.storage.from("attachments").upload(path, attachment);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("attachments").getPublicUrl(path);
        attachmentUrl = publicUrl.publicUrl;
      }

      // Inserendo in home_expenses, il trigger DB crea automaticamente
      // la riga gemella in expenses — non serve inserirla due volte.
      const { error } = await supabase.from("home_expenses").insert({
        household_id: householdId,
        category_id: categoryId,
        amount: Number(amount),
        date,
        description: description || null,
        attachment_url: attachmentUrl,
        created_by: userId,
      });
      if (error) throw error;

      setCategoryId("");
      setAmount("");
      setDescription("");
      setAttachment(null);
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
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={loadingCategories}>
          <option value="">Seleziona categoria...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Importo (€)</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Descrizione</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Facoltativa" />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Allegato (fattura/scontrino)</Label>
        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
      </div>

      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
