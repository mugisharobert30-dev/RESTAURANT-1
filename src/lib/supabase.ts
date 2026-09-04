import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const getAnon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(getUrl() && getAnon());
}

// Browser client (client components)
export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(getUrl(), getAnon());
}

// Server client bound to the request cookies (server components / route handlers)
type CookieNode = {
  get: (name: string) => { value?: string } | null;
  set: (name: string, value: string, options: object) => void;
  remove: (name: string, options: object) => void;
};

export function createServerSupabaseClient(cookies: CookieNode): SupabaseClient {
  return createServerClient(getUrl(), getAnon(), {
    cookies: {
      get(name: string) {
        return cookies.get(name);
      },
      set(name: string, value: string, options: object) {
        try {
          cookies.set(name, value, options);
        } catch {}
      },
      remove(name: string, options: object) {
        try {
          cookies.remove(name, options);
        } catch {}
      },
    },
  });
}

// Deprecated single-instantiation browser client kept for existing callers.
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createBrowserSupabaseClient();
}
