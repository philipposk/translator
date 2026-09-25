import { PublicLayout } from "@/components/PublicLayout";
import { TermsContent } from "@/components/docs/TermsContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service | Translator",
  description: "Terms of use for the Translator app by 6x7.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PublicLayout title="Terms of Service">
      <TermsContent />
    </PublicLayout>
  );
}
