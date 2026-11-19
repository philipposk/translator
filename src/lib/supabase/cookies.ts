const isProd = process.env.NODE_ENV === "production";
// Set AUTH_COOKIE_DOMAIN=.6x7.gr in production for cross-subdomain SSO.
// Leave unset on Vercel previews or custom domains (host-only cookies).
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();

export const sharedCookieOptions = {
  name: "sb-6x7-auth",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
};

export const APP_NAME = "translator";

/** Cookie domain for the host being served: `.6x7.dk` on the .dk mirror, `.6x7.gr` everywhere else (unchanged). */
export function cookieOptionsForHost(host?: string | null) {
  if (!isProd) return sharedCookieOptions;
  const h = (host ?? "").split(":")[0].toLowerCase();
  const domain = h === "6x7.dk" || h.endsWith(".6x7.dk") ? ".6x7.dk" : ".6x7.gr";
  return { ...sharedCookieOptions, domain };
}

export function hostFromHeaders(h: { get(name: string): string | null }): string | null {
  return h.get("x-forwarded-host") ?? h.get("host");
}
