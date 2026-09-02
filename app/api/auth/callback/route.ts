import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const next =
    nextParam && /^\/[a-zA-Z0-9\-_/?=&.%#]*$/.test(nextParam)
      ? nextParam
      : "/";

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("[auth/callback] exchangeCodeForSession failed:", err);
      return NextResponse.redirect(
        new URL(
          `/auth?mode=signin&error=callback_error&next=${encodeURIComponent(next)}`,
          requestUrl.origin
        )
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
