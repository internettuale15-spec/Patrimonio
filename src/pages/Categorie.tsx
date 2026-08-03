import { useState } from "react";
import { Tags, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCategoryManager } from "@/hooks/useCategoryManager";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Category, CategoryKind } from "@/types";
import { cn } from "@/lib/utils";

const GROUPS: { kind: CategoryKind; label: string; dot: string }[] = [
  { kind: "entrata", label: "Entrate", dot: "bg-income" },
  { kind: "spesa_fissa", label: "Spese fisse", dot: "bg-expense" },
  { kind: "spesa_variabile", label: "Spese variabili", dot: "bg-expense" },
  { kind: "casa", label: "Casa", dot: "bg-goal" },
  { kind: "investimento", label: "Investimenti", dot: "bg-investment" },
];

function CategoryRow({
  category, onRename, onDelete,
}: {
  category: Category;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (name.trim() === category.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onRename(category.id, name);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setName(category.name); setEditing(false); }
          }}
        />
        <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-full hover:bg-muted text-income shrink-0">
          <Check size={16} />
        </button>
        <button onClick={() => { setName(category.name); setEditing(false); }} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground shrink-0">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="text-sm">
        {category.name}
        {category.is_default && (
          <span className="ml-2 text-[10px] text-muted-foreground align-middle">predefinita</span>
        )}
      </span>
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground" aria-label="Rinomina">
          <Pencil size={13} />
        </button>
        <button
          onClick={() => {
            if (confirm(`Eliminare la categoria "${category.name}"?`)) onDelete(category.id);
          }}
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-danger"
          aria-label="Elimina"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function AddCategoryRow({ kind, onAdd }: { kind: CategoryKind; onAdd: (kind: CategoryKind, name: string) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(kind, name);
    setSaving(false);
    setName("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
      >
        <Plus size={13} /> Aggiungi categoria
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Input
        placeholder="Nome categoria"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") { setName(""); setAdding(false); }
        }}
      />
      <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "..." : "Aggiungi"}</Button>
    </div>
  );
}

export default function Categorie() {
  const { householdId } = useAuthStore();
  const { categories, loading, error, setError, addCategory, renameCategory, deleteCategory } = useCategoryManager(householdId);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Tags size={20} className="text-primary" /> Categorie
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggiungi, rinomina o elimina le categorie usate in tutta l'app.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-4">
          {GROUPS.map((g) => {
            const items = categories.filter((c) => c.kind === g.kind);
            return (
              <div key={g.kind} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-2 h-2 rounded-full", g.dot)} />
                  <span className="font-medium text-sm">{g.label}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {items.map((c) => (
                    <CategoryRow key={c.id} category={c} onRename={renameCategory} onDelete={deleteCategory} />
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">Nessuna categoria in questo gruppo.</p>
                  )}
                </div>
                <AddCategoryRow kind={g.kind} onAdd={addCategory} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
