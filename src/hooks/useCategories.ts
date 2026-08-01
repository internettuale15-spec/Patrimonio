import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Category, CategoryKind } from "@/types";

export function useCategories(householdId: string | null, kind: CategoryKind) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    setLoading(true);
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", householdId)
      .eq("kind", kind)
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // eslint-disable-next-line no-console
          console.error("Errore caricamento categorie:", error.message);
          setCategories([]);
        } else {
          setCategories((data ?? []) as Category[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [householdId, kind]);

  return { categories, loading };
}
