export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="tr-page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}
