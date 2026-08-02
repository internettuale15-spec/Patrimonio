import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Category, CategoryKind } from "@/types";

export function useCategoryManager(householdId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("household_id", householdId)
      .order("kind")
      .order("name");
    if (error) {
      console.error("Errore caricamento categorie:", error.message);
      setCategories([]);
    } else {
      setCategories((data ?? []) as Category[]);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function addCategory(kind: CategoryKind, name: string) {
    setError(null);
    if (!householdId || !name.trim()) return;
    const { error } = await supabase.from("categories").insert({
      household_id: householdId,
      kind,
      name: name.trim(),
    });
    if (error) {
      setError(
        error.code === "23505"
          ? "Esiste già una categoria con questo nome in questo gruppo."
          : error.message
      );
      return;
    }
    await refetch();
  }

  async function renameCategory(id: string, name: string) {
    setError(null);
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", id);
    if (error) {
      setError(
        error.code === "23505"
          ? "Esiste già una categoria con questo nome in questo gruppo."
          : error.message
      );
      return;
    }
    await refetch();
  }

  async function deleteCategory(id: string) {
    setError(null);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      setError(
        error.code === "23503"
          ? "Non puoi eliminarla: è già usata in alcuni movimenti. Puoi rinominarla invece."
          : error.message
      );
      return;
    }
    await refetch();
  }

  return { categories, loading, error, setError, addCategory, renameCategory, deleteCategory, refetch };
}
