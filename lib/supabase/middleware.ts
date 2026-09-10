import {
  createServerClient,
  type CookieOptions,
  type CookieMethodsServer,
  type CookieOptionsWithName
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieTuple = { name: string; value: string; options?: CookieOptionsWithName };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): ReturnType<CookieMethodsServer["getAll"]> {
          return request.cookies.getAll() as ReturnType<CookieMethodsServer["getAll"]>;
        },
        setAll(cookiesToSet: CookieTuple[]): void | Promise<void> {
          cookiesToSet.forEach(({ name, value }: CookieTuple) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieTuple) =>
            response.cookies.set(name, value, options as CookieOptions)
          );
        }
      }
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // FIX B#04: Next.js ELIMINA los paréntesis de route groups del pathname.
  // "/(app)/mis-rifas/creadas" pathname real = "/mis-rifas/creadas". Condición
  // startsWith("/(app)") NUNCA coincidía. Listado exhaustivo de paths privados
  // usando prefijos de carpetas. Si se agrega nueva ruta en route group (app),
  // agregar el prefijo aquí.
  const privatePrefixes = [
    "/rifas/crear",
    "/rifas/editar",
    "/mis-rifas",
    "/mis-numeros",
    "/perfil",
    "/checkout",
    "/panel",
    "/admin",
    "/dashboard",
    "/api/admin"
  ];
  const isPrivateRoute =
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api/") && // los /api/auth/* se protegen solos
    privatePrefixes.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabase response here
  return response;
}
