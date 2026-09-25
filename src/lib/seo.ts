import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://translator.6x7.gr";
export const SITE_NAME = "Translator";

export function pageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const PUBLIC_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/help", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/privacy", priority: 0.5 },
  { path: "/terms", priority: 0.5 },
  { path: "/login", priority: 0.6 },
  { path: "/llm.txt", priority: 0.3 },
  { path: "/llms.txt", priority: 0.3 },
] as const;
