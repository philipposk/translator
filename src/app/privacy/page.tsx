import { PublicLayout } from "@/components/PublicLayout";
import { PrivacyContent } from "@/components/docs/PrivacyContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy | Translator",
  description: "How Translator collects, uses, and protects your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PublicLayout title="Privacy Policy">
      <PrivacyContent />
    </PublicLayout>
  );
}
