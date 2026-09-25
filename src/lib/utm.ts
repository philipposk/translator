/** Append UTM params to outbound links for analytics. */
export function withUtm(href: string, campaign = "translator"): string {
  if (!href.startsWith("http")) return href;
  try {
    const u = new URL(href);
    if (u.hostname.endsWith("6x7.gr") || u.hostname === "localhost") return href;
    u.searchParams.set("utm_source", "translator");
    u.searchParams.set("utm_medium", "referral");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return href;
  }
}
