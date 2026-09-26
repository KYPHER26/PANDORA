import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Couple, Profile } from "../types/database";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  couple: Couple | null;
  partner: Profile | null;
  loading: boolean;
  error: string | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "That email or password doesn't look right.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email before signing in.";
  }
  if (/already registered/i.test(message)) {
    return "That email is already registered — try signing in instead.";
  }
  if (/network/i.test(message)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfileAndCouple(userId: string) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      setError(friendlyAuthError(profileError.message));
      setLoading(false);
      return;
    }

    setProfile(profileRow);

    if (profileRow?.couple_id) {
      const { data: coupleRow } = await supabase
        .from("couples")
        .select("*")
        .eq("id", profileRow.couple_id)
        .single();

      setCouple(coupleRow ?? null);

      if (coupleRow) {
        const partnerId =
          coupleRow.partner_one_id === userId ? coupleRow.partner_two_id : coupleRow.partner_one_id;
        if (partnerId) {
          const { data: partnerRow } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();
          setPartner(partnerRow ?? null);
        }
      }
    } else {
      setCouple(null);
      setPartner(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfileAndCouple(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setLoading(true);
        loadProfileAndCouple(newSession.user.id);
      } else {
        setProfile(null);
        setCouple(null);
        setPartner(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signInWithPassword(email: string, password: string) {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const message = friendlyAuthError(signInError.message);
      setError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signUpWithPassword(email: string, password: string, fullName: string) {
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) {
      const message = friendlyAuthError(signUpError.message);
      setError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signInWithGoogle() {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      const message = friendlyAuthError(oauthError.message);
      setError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function sendPasswordReset(email: string) {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      const message = friendlyAuthError(resetError.message);
      setError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadProfileAndCouple(session.user.id);
    }
  }

  const value = useMemo(
    () => ({
      session,
      profile,
      couple,
      partner,
      loading,
      error,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      sendPasswordReset,
      signOut,
      refreshProfile,
    }),
    [session, profile, couple, partner, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
