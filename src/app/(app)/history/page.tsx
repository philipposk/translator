import { HistoryClient } from "@/components/HistoryClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "History | Translator",
  description: "Your saved translations. Export, review, or delete past jobs.",
  path: "/history",
  noIndex: true,
});

export default function HistoryPage() {
  return <HistoryClient />;
}
