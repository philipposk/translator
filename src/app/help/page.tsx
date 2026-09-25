import { PublicLayout } from "@/components/PublicLayout";
import { HelpContent } from "@/components/docs/HelpContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Help & documentation | Translator",
  description: "How to use Live, Text, Upload and Camera modes. FAQ, API docs, and support.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <PublicLayout title="Help & documentation">
      <HelpContent />
    </PublicLayout>
  );
}
