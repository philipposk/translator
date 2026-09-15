import { PublicLayout } from "@/components/PublicLayout";
import { HelpContent } from "@/components/docs/HelpContent";

export const metadata = { title: "Help — Translator" };

export default function HelpPage() {
  return (
    <PublicLayout title="Help & documentation">
      <HelpContent />
    </PublicLayout>
  );
}
