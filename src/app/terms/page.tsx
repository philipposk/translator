import { PublicLayout } from "@/components/PublicLayout";
import { TermsContent } from "@/components/docs/TermsContent";

export const metadata = { title: "Terms of Service — Translator" };

export default function TermsPage() {
  return (
    <PublicLayout title="Terms of Service">
      <TermsContent />
    </PublicLayout>
  );
}
