import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti. Crea un file .env (vedi .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

/**
 * Helper per iscriversi ai cambiamenti realtime di una tabella,
 * filtrati per household — usato per la sincronizzazione Mirco <-> Debora.
 */
export function subscribeToTable(
  table: string,
  householdId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`realtime:${table}:${householdId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `household_id=eq.${householdId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
