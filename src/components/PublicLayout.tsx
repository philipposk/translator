import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export function PublicLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav showCta />
      <main id="main-content" className="tr-public">
        <article className="tr-doc glass">
          <h1>{title}</h1>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
