import {
  createServerClient,
  type CookieOptions,
  type CookieMethodsServer,
  type CookieOptionsWithName
} from "@supabase/ssr";
import { cookies } from "next/headers";
import { type Database } from "@/types/supabase";

type CookieTuple = { name: string; value: string; options?: CookieOptionsWithName };

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [] as string[];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(
      `[supabase/server] Faltan Environment Variables OBLIGATORIAS: ${missing.join(", ")}. ` +
        `Estas variables son necesarias para crear el cliente SSR de Supabase. ` +
        `Si estás en Vercel: entra Project → Settings → Environment Variables y agrega esas keys (deben estar marcadas para Build + Runtime Production).`
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll(): ReturnType<CookieMethodsServer["getAll"]> {
        return cookieStore.getAll() as ReturnType<CookieMethodsServer["getAll"]>;
      },
      setAll(cookiesToSet: CookieTuple[]): void | Promise<void> {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieTuple) =>
            cookieStore.set(name, value, options as CookieOptions)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      }
    }
  });
}

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [] as string[];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    throw new Error(
      `[supabase/server] Faltan Environment Variables OBLIGATORIAS (service client): ${missing.join(", ")}. ` +
        `SUPABASE_SERVICE_ROLE_KEY es requerido para webhooks y RPC que hacen bypass a RLS. ` +
        `En Vercel: Project → Settings → Environment Variables → Añadir con visibilidad Production (no la pública / NEXT_PUBLIC).`
    );
  }
  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // service client no debe escribir cookies de auth (riesgo sesiones cruzadas)
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
