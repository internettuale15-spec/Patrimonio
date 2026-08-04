import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SearchResult {
  id: string;
  type: "entrata" | "spesa";
  description: string;
  categoryName: string | null;
  amount: number;
  date: string;
}

export function useGlobalSearch(householdId: string | null, query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!householdId || query.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      const term = query.trim();
      const numericTerm = term.replace(",", ".");
      const isNumeric = !isNaN(Number(numericTerm)) && numericTerm !== "";

      const [{ data: incomes }, { data: expenses }] = await Promise.all([
        supabase
          .from("incomes")
          .select("id, amount, date, description, categories(name)")
          .eq("household_id", householdId)
          .or(
            isNumeric
              ? `description.ilike.%${term}%,amount.eq.${numericTerm}`
              : `description.ilike.%${term}%`
          )
          .order("date", { ascending: false })
          .limit(8),
        supabase
          .from("expenses")
          .select("id, amount, date, description, categories(name)")
          .eq("household_id", householdId)
          .or(
            isNumeric
              ? `description.ilike.%${term}%,amount.eq.${numericTerm}`
              : `description.ilike.%${term}%`
          )
          .order("date", { ascending: false })
          .limit(8),
      ]);

      if (cancelled) return;

      // Ricerca anche per nome categoria: prendiamo le categorie che combaciano
      // e recuperiamo i movimenti recenti legati a quelle categorie.
      const { data: matchingCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("household_id", householdId)
        .ilike("name", `%${term}%`);

      let categoryIncomes: any[] = [];
      let categoryExpenses: any[] = [];
      if (matchingCategories && matchingCategories.length > 0) {
        const catIds = matchingCategories.map((c) => c.id);
        const [{ data: ci }, { data: ce }] = await Promise.all([
          supabase
            .from("incomes")
            .select("id, amount, date, description, categories(name)")
            .eq("household_id", householdId)
            .in("category_id", catIds)
            .order("date", { ascending: false })
            .limit(5),
          supabase
            .from("expenses")
            .select("id, amount, date, description, categories(name)")
            .eq("household_id", householdId)
            .in("category_id", catIds)
            .order("date", { ascending: false })
            .limit(5),
        ]);
        categoryIncomes = ci ?? [];
        categoryExpenses = ce ?? [];
      }

      if (cancelled) return;

      const dedupe = (rows: any[]) => {
        const seen = new Set<string>();
        return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
      };

      const allIncomes = dedupe([...(incomes ?? []), ...categoryIncomes]);
      const allExpenses = dedupe([...(expenses ?? []), ...categoryExpenses]);

      const mapped: SearchResult[] = [
        ...allIncomes.map((r: any) => ({
          id: r.id,
          type: "entrata" as const,
          description: r.description || r.categories?.name || "Entrata",
          categoryName: r.categories?.name ?? null,
          amount: Number(r.amount),
          date: r.date,
        })),
        ...allExpenses.map((r: any) => ({
          id: r.id,
          type: "spesa" as const,
          description: r.description || r.categories?.name || "Spesa",
          categoryName: r.categories?.name ?? null,
          amount: Number(r.amount),
          date: r.date,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setResults(mapped.slice(0, 12));
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [householdId, query]);

  return { results, loading };
}
