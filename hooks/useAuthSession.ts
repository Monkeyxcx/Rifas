"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Perfil } from "@/lib/types";

export type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Perfil | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export function useAuthSession(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadProfile = async (userId: string) => {
    try {
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (pErr) {
        console.warn("[useAuthSession] loadProfile error:", pErr.message);
        return;
      }
      setProfile((data as unknown as Perfil) ?? null);
    } catch (e) {
      console.warn("[useAuthSession] loadProfile exception:", e);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const {
          data: { session: initialSession }
        } = await supabase.auth.getSession();

        if (cancelled) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadProfile(initialSession.user.id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "session init failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setError(null);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign out failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    error,
    signOut,
    refreshProfile: () => (user ? loadProfile(user.id) : Promise.resolve())
  };
}
