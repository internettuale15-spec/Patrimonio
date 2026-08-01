import { create } from "zustand";
import { supabase, subscribeToTable } from "@/lib/supabase";
import type { Income, Expense, Investment, Asset, Liability, Goal, Budget, Deadline } from "@/types";

interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
  budgets: Budget[];
  deadlines: Deadline[];
  loading: boolean;

  fetchAll: (householdId: string) => Promise<void>;
  subscribeRealtime: (householdId: string) => () => void;

  addIncome: (income: Partial<Income>) => Promise<void>;
  addExpense: (expense: Partial<Expense>) => Promise<void>;
}

async function fetchTable<T>(table: string, householdId: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("household_id", householdId)
    .order("date", { ascending: false });
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Errore fetch ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  incomes: [],
  expenses: [],
  investments: [],
  assets: [],
  liabilities: [],
  goals: [],
  budgets: [],
  deadlines: [],
  loading: true,

  fetchAll: async (householdId) => {
    set({ loading: true });
    const [incomes, expenses, investments, assets, liabilities, goals, budgets, deadlines] =
      await Promise.all([
        fetchTable<Income>("incomes", householdId),
        fetchTable<Expense>("expenses", householdId),
        fetchTable<Investment>("investments", householdId),
        fetchTable<Asset>("assets", householdId),
        fetchTable<Liability>("liabilities", householdId),
        fetchTable<Goal>("goals", householdId),
        fetchTable<Budget>("budgets", householdId),
        fetchTable<Deadline>("deadlines", householdId),
      ]);
    set({
      incomes, expenses, investments, assets, liabilities, goals, budgets, deadlines,
      loading: false,
    });
  },

  subscribeRealtime: (householdId) => {
    // Ogni tabella si re-interroga quando arriva un cambiamento:
    // semplice e robusto; si può ottimizzare con merge puntuale in seguito.
    const unsubs = [
      "incomes", "expenses", "investments", "assets",
      "liabilities", "goals", "budgets", "deadlines",
    ].map((table) =>
      subscribeToTable(table, householdId, () => get().fetchAll(householdId))
    );
    return () => unsubs.forEach((unsub) => unsub());
  },

  addIncome: async (income) => {
    const { error } = await supabase.from("incomes").insert(income);
    if (error) throw error;
  },

  addExpense: async (expense) => {
    const { error } = await supabase.from("expenses").insert(expense);
    if (error) throw error;
  },
}));
