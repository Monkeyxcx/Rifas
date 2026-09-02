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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
