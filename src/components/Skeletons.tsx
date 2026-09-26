export function MemoryCardSkeleton() {
  return (
    <div className="rounded-soft border border-hairline bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton mb-2 h-4 w-3/4 rounded" />
      <div className="skeleton mb-2 h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-square rounded-lg" />
      ))}
    </div>
  );
}
