import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { sharedCookieOptions } from "@/lib/supabase/cookies";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: sharedCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

// Only refreshes the Supabase session cookie for page navigations. It does NOT
// gate access — each API route enforces its own auth via getUserId(), and pages
// guard in their server component (e.g. /app redirects to /login). API routes,
// the service worker, manifest, icons and static assets are excluded.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sw.js|manifest.webmanifest|icons|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
