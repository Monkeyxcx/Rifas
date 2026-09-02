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

  const isPrivateRoute = request.nextUrl.pathname.startsWith("/(app)") ||
    (!request.nextUrl.pathname.startsWith("/_next") &&
      !request.nextUrl.pathname.startsWith("/api") &&
      ["/rifas/crear", "/mis-rifas", "/perfil", "/checkout"].some((p) =>
        request.nextUrl.pathname.startsWith(p)
      ));

  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabase response here
  return response;
}
