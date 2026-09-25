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
