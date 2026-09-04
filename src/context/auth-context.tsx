"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthCtx {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<Profile>;
  login: (emailOrPhone: string, password: string) => Promise<Profile>;
  register: (input: { full_name: string; email: string; phone: string; password: string }) => Promise<Profile>;
  logout: () => Promise<void>;
  updateProfileLocal: (p: Partial<Profile>) => void;
  refreshProfile: () => Promise<void>;
  supabaseEnabled: boolean;
}

const Ctx = createContext<AuthCtx>({
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  isStaff: false,
  signIn: async () => {
    throw new Error("no provider");
  },
  login: async () => {
    throw new Error("no provider");
  },
  register: async () => {
    throw new Error("no provider");
  },
  logout: async () => {},
  updateProfileLocal: () => {},
  refreshProfile: async () => {},
  supabaseEnabled: false,
});

function toProfile(row: any): Profile | null {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name ?? row.email ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role ?? "customer",
    avatar_url: row.avatar_url,
    active: row.active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef<ReturnType<typeof getSupabaseBrowser>>(null);

  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = getSupabaseBrowser();
    return clientRef.current;
  }, []);

  const refreshProfile = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const p = toProfile(data);
    if (p && !p.active) {
      setProfile(null);
      return;
    }
    setProfile(p);
  }, [getClient]);

  useEffect(() => {
    const client = getClient();
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (!active) return;
        if (!session) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const { data } = await client
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (!active) return;
        setProfile(toProfile(data));
      } catch {
        if (!active) return;
        setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session) {
        setProfile(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void (async () => {
          try {
            const { data } = await client
              .from("profiles")
              .select("*")
              .eq("id", session!.user.id)
              .maybeSingle();
            if (!active) return;
            setProfile(toProfile(data));
          } catch {
            // ignore; session will be retried on next auth event
          }
        })();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [getClient]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<Profile> => {
      const client = getClient();
      if (!client) throw new Error("Supabase is not configured.");
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user) throw new Error(error?.message || "Login failed.");
      const { data: row } = await client.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      const p = toProfile(row);
      if (!p) throw new Error("No profile found for this account.");
      setProfile(p);
      return p;
    },
    [getClient]
  );

  const register = useCallback(
    async (input: { full_name: string; email: string; phone: string; password: string }): Promise<Profile> => {
      const client = getClient();
      if (!client) throw new Error("Supabase is not configured.");
      const { data, error } = await client.auth.signUp({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        options: {
          data: { full_name: input.full_name, phone: input.phone },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Could not create your account.");
      // The on_auth_user_created trigger creates the profile; fetch it.
      await new Promise((r) => setTimeout(r, 1200));
      const { data: row } = await client.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      const p = toProfile(row) ?? {
        id: data.user.id,
        full_name: input.full_name,
        email: data.user.email ?? "",
        phone: input.phone,
        role: "customer",
        active: true,
        created_at: new Date().toISOString(),
      };
      setProfile(p);
      return p;
    },
    [getClient]
  );

  const logout = useCallback(async () => {
    const client = getClient();
    if (client) await client.auth.signOut();
    setProfile(null);
  }, [getClient]);

  const updateProfileLocal = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((cur) => {
        if (!cur) return cur;
        const next = { ...cur, ...patch };
        const client = getClient();
        if (client) {
          client
            .from("profiles")
            .update({
              full_name: next.full_name,
              phone: next.phone,
              avatar_url: next.avatar_url,
            })
            .eq("id", next.id)
            .then(() => {});
        }
        return next;
      });
    },
    [getClient]
  );

  const value = useMemo<AuthCtx>(
    () => ({
      profile,
      loading,
      isAdmin: profile?.role === "superadmin" || profile?.role === "admin",
      isSuperAdmin: profile?.role === "superadmin",
      isStaff:
        !!profile &&
        ["superadmin", "admin", "manager", "waiter", "kitchen", "cashier", "delivery"].includes(profile.role),
      signIn,
      login: signIn,
      register,
      logout,
      updateProfileLocal,
      refreshProfile,
      supabaseEnabled: !!getClient(),
    }),
    [profile, loading, signIn, register, logout, updateProfileLocal, refreshProfile, getClient]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
