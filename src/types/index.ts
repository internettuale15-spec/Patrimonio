export type RecurrenceType = "una_tantum" | "mensile" | "annuale";
export type CategoryKind = "entrata" | "spesa_fissa" | "spesa_variabile" | "casa" | "investimento";
export type InvestmentType =
  | "etf" | "pac" | "azione" | "obbligazione"
  | "conto_deposito" | "crypto" | "fondo_pensione" | "liquidita";
export type AssetType = "conto_corrente" | "contanti" | "casa" | "auto" | "altro_bene";
export type LiabilityType = "mutuo" | "prestito" | "carta" | "finanziamento";

export interface Profile {
  id: string;
  household_id: string;
  full_name: string;
  color: string;
  avatar_url?: string | null;
  telegram_chat_id?: number | null;
  telegram_link_code?: string | null;
}

export interface Category {
  id: string;
  household_id: string;
  kind: CategoryKind;
  name: string;
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
  is_default?: boolean;
}

export interface Recurrence {
  id: string;
  type: RecurrenceType;
  interval_count: number;
  day_of_month?: number | null;
  month_of_year?: number | null;
  start_date: string;
  end_date?: string | null;
  next_run_date: string;
  active: boolean;
}

export interface Income {
  id: string;
  household_id: string;
  user_id?: string | null;
  category_id?: string | null;
  recurrence_id?: string | null;
  amount: number;
  date: string;
  description?: string | null;
  source?: string | null;
}

export interface Expense {
  id: string;
  household_id: string;
  user_id?: string | null;
  category_id?: string | null;
  recurrence_id?: string | null;
  amount: number;
  date: string;
  description?: string | null;
  attachment_url?: string | null;
  is_home_expense: boolean;
}

export interface Investment {
  id: string;
  household_id: string;
  user_id?: string | null;
  type: InvestmentType;
  name: string;
  broker?: string | null;
  ticker?: string | null;
  quantity: number;
  avg_price: number;
  current_price: number;
  currency: string;
  notes?: string | null;
}

export interface Asset {
  id: string;
  household_id: string;
  type: AssetType;
  name: string;
  value: number;
}

export interface Liability {
  id: string;
  household_id: string;
  type: LiabilityType;
  name: string;
  remaining_amount: number;
  monthly_payment?: number | null;
  interest_rate?: number | null;
  due_day?: number | null;
}

export interface Goal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
}

export interface Deadline {
  id: string;
  household_id: string;
  title: string;
  category?: string | null;
  amount?: number | null;
  due_date: string;
  is_paid: boolean;
}

export interface DashboardSummary {
  netWorth: number;
  liquidity: number;
  investmentsValue: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  yearlyIncome: number;
  yearlyExpense: number;
  yearlySavings: number;
  budgetUsedPct: number;
  goalsCompletedCount: number;
  goalsTotalCount: number;
}
