"use client";

import { useEffect, useRef, useState } from "react";
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
  const inFlightProfileUserIdRef = useRef<string | null>(null);
  const loadedProfileUserIdRef = useRef<string | null>(null);

  const supabase = createClient();

  const loadProfile = async (userId: string, force = false) => {
    if (!force) {
      if (inFlightProfileUserIdRef.current === userId) return;
      if (loadedProfileUserIdRef.current === userId) return;
    }
    try {
      inFlightProfileUserIdRef.current = userId;
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (pErr) {
        console.warn("[useAuthSession] loadProfile error:", pErr.message);
        return;
      }
      loadedProfileUserIdRef.current = userId;
      setProfile((data as unknown as Perfil) ?? null);
    } catch (e) {
      console.warn("[useAuthSession] loadProfile exception:", e);
    } finally {
      if (inFlightProfileUserIdRef.current === userId) {
        inFlightProfileUserIdRef.current = null;
      }
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
        loadedProfileUserIdRef.current = null;
        inFlightProfileUserIdRef.current = null;
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
      // FIX B#10: Llamar route handler server-side para limpiar cookies
      // correctamente (createClient SSR), luego redirect client side.
      try {
        await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      } catch { /* ignore network errors, local signOut anyway */ }
      await supabase.auth.signOut();
      loadedProfileUserIdRef.current = null;
      inFlightProfileUserIdRef.current = null;
      setProfile(null);
      setUser(null);
      setSession(null);
      // FIX B#10: Redirect explícito para feedback inmediato (no esperar
      // re-fetch server components ni middleware redirects).
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign out failed");
      if (typeof window !== "undefined") {
        window.location.href = "/auth?error=signout";
      }
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
    refreshProfile: () => (user ? loadProfile(user.id, true) : Promise.resolve())
  };
}
