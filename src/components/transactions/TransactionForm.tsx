import { useState } from "react";
import { Label, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RecurrenceFields } from "@/components/transactions/RecurrenceFields";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/lib/supabase";
import { computeNextRunDate } from "@/lib/recurrence";
import type { CategoryKind, RecurrenceType } from "@/types";

interface TransactionFormProps {
  householdId: string;
  userId: string;
  table: "incomes" | "expenses";
  categoryKind: CategoryKind;
  allowAttachment?: boolean;
  presetCategoryId?: string;
  onSuccess?: () => void;
}

export function TransactionForm({
  householdId, userId, table, categoryKind, allowAttachment, presetCategoryId, onSuccess,
}: TransactionFormProps) {
  const { categories, loading: loadingCategories } = useCategories(householdId, categoryKind);

  const [categoryId, setCategoryId] = useState(presetCategoryId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("una_tantum");
  const [dayOfMonth, setDayOfMonth] = useState(1);
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
      let recurrenceId: string | null = null;
      let attachmentUrl: string | null = null;

      // Upload allegato facoltativo (scontrino/fattura) su Supabase Storage
      if (allowAttachment && attachment) {
        const path = `${householdId}/${Date.now()}-${attachment.name}`;
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(path, attachment);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("attachments").getPublicUrl(path);
        attachmentUrl = publicUrl.publicUrl;
      }

      // Se ricorrente, crea prima la riga in recurrences
      if (recurrenceType !== "una_tantum") {
        const nextRun = computeNextRunDate({
          type: recurrenceType,
          startDate: date,
          dayOfMonth,
        });
        const { data: recurrence, error: recError } = await supabase
          .from("recurrences")
          .insert({
            household_id: householdId,
            type: recurrenceType,
            day_of_month: recurrenceType === "mensile" ? dayOfMonth : null,
            start_date: date,
            next_run_date: nextRun.toISOString().slice(0, 10),
            active: true,
          })
          .select()
          .single();
        if (recError) throw recError;
        recurrenceId = recurrence.id;
      }

      const payload: Record<string, unknown> = {
        household_id: householdId,
        user_id: userId,
        category_id: categoryId,
        recurrence_id: recurrenceId,
        amount: Number(amount),
        date,
        description: description || null,
        created_by: userId,
      };
      if (table === "expenses") {
        payload.attachment_url = attachmentUrl;
      }

      const { error: insertError } = await supabase.from(table).insert(payload);
      if (insertError) throw insertError;

      // reset form
      setCategoryId("");
      setAmount("");
      setDescription("");
      setRecurrenceType("una_tantum");
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

      <RecurrenceFields
        value={recurrenceType}
        onChange={setRecurrenceType}
        dayOfMonth={dayOfMonth}
        onDayOfMonthChange={setDayOfMonth}
      />

      {allowAttachment && (
        <div className="flex flex-col gap-1">
          <Label>Allegato (scontrino/fattura)</Label>
          <Input type="file" accept="image/*,application/pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
        </div>
      )}

      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
