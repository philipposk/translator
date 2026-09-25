import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign in | Translator",
  description: "Sign in to Translator with Google or a magic link. One 6x7 account for all apps.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
