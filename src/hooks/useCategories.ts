import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Category, CategoryKind } from "@/types";

export function useCategories(householdId: string | null, kind: CategoryKind | CategoryKind[]) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const kindKey = Array.isArray(kind) ? kind.join(",") : kind;

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;

    setLoading(true);
    const query = supabase.from("categories").select("*").eq("household_id", householdId);
    const filtered = Array.isArray(kind) ? query.in("kind", kind) : query.eq("kind", kind);

    filtered
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, kindKey]);

  return { categories, loading };
}
