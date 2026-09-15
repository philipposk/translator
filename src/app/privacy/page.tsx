import { PublicLayout } from "@/components/PublicLayout";
import { PrivacyContent } from "@/components/docs/PrivacyContent";

export const metadata = { title: "Privacy Policy — Translator" };

export default function PrivacyPage() {
  return (
    <PublicLayout title="Privacy Policy">
      <PrivacyContent />
    </PublicLayout>
  );
}
