export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="tr-skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="tr-skeleton-line" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}
