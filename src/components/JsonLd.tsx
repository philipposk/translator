import { SITE_NAME, SITE_URL } from "@/lib/seo";

export function JsonLd({ type = "WebApplication" }: { type?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": type,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Live voice, text, file and camera translation with a grounded AI assistant.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: "6x7", url: "https://6x7.gr" },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
