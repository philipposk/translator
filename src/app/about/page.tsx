import { PublicLayout } from "@/components/PublicLayout";
import { AboutContent } from "@/components/docs/AboutContent";

export const metadata = { title: "About — Translator" };

export default function AboutPage() {
  return (
    <PublicLayout title="About Translator">
      <AboutContent />
    </PublicLayout>
  );
}
