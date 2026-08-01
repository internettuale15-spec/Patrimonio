import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  householdId: string | null;
  hasSession: boolean;
  loading: boolean;
  initialized: boolean;
  authError: string | null;

  init: () => void;
  loadProfile: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    householdCode?: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  householdId: null,
  hasSession: false,
  loading: true,
  initialized: false,
  authError: null,

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id;
      if (userId) {
        set({ hasSession: true });
        get().loadProfile(userId);
      } else {
        set({ hasSession: false, loading: false });
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ hasSession: true });
        get().loadProfile(session.user.id);
      } else {
        set({ profile: null, householdId: null, hasSession: false, loading: false });
      }
    });
  },

  loadProfile: async (userId: string) => {
    set({ loading: true });
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Errore caricamento profilo:", error.message);
    }

    set({
      profile: (profile as Profile) ?? null,
      householdId: profile?.household_id ?? null,
      loading: false,
    });
  },

  signIn: async (email, password) => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authError: error.message });
      throw error;
    }
  },

  signUp: async ({ email, password, fullName, householdCode }) => {
    set({ authError: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ authError: error.message });
      throw error;
    }

    // Se la conferma email è attiva, non c'è ancora una sessione:
    // il profilo verrà creato al primo login riuscito (vedi Login.tsx).
    if (!data.session || !data.user) {
      return { needsEmailConfirmation: true };
    }

    await createProfileForUser(data.user.id, fullName, householdCode);
    await get().loadProfile(data.user.id);
    return { needsEmailConfirmation: false };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, householdId: null });
  },
}));

/**
 * Crea l'household (se non viene fornito un codice famiglia esistente) e il
 * profilo collegato. Se householdCode è fornito, l'utente si unisce a un
 * household esistente (es. Debora che si unisce all'household di Mirco).
 */
export async function createProfileForUser(userId: string, fullName: string, householdCode?: string) {
  let householdId = householdCode?.trim();

  if (!householdId) {
    // Generiamo l'id lato client ed evitiamo `.select()` dopo l'insert:
    // con RLS, un INSERT ... RETURNING viene bloccato se la policy di SELECT
    // non permette ancora di "vedere" la riga appena creata — e al primo
    // accesso il profilo (da cui dipende fn_current_household()) non esiste
    // ancora. Non richiedendo la riga di ritorno, evitiamo il controllo.
    householdId = crypto.randomUUID();
    const { error: householdError } = await supabase
      .from("households")
      .insert({ id: householdId, name: `Famiglia ${fullName}` });
    if (householdError) throw householdError;
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    household_id: householdId,
    full_name: fullName,
  });
  if (profileError) throw profileError;
}
