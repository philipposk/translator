import { PublicLayout } from "@/components/PublicLayout";
import { AboutContent } from "@/components/docs/AboutContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About | Translator",
  description: "Translator by 6x7: live voice, text, file and camera translation with a grounded AI assistant.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PublicLayout title="About Translator">
      <AboutContent />
    </PublicLayout>
  );
}
