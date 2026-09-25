import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { SkipToContent } from "@/components/SkipToContent";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import { FloatingContact } from "@/components/FloatingContact";
import { ThemeProvider } from "@/components/ThemeProvider";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${SITE_NAME} | Speak it, get clean text in any language`,
    description:
      "Live voice, text, file and camera translation. Speak, type, upload or point your camera and get instant translation.",
    path: "/",
  }),
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE_NAME },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  metadataBase: new URL(SITE_URL),
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <SkipToContent />
          <ScrollProgress />
          {children}
          <ScrollToTop />
          <FloatingContact />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
