import { useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useMemories } from "../hooks/useMemories";
import MemoryCard from "../components/MemoryCard";
import EmptyState from "../components/EmptyState";
import { MemoryCardSkeleton } from "../components/Skeletons";
import { useNavigate } from "react-router-dom";

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
}

export default function Timeline() {
  const { memories, loading } = useMemories();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof memories>();
    for (const m of memories) {
      const key = m.date;
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return Array.from(map.entries());
  }, [memories]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Our Timeline</h1>
        <p className="text-sm text-dim">Every memory, side by side.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No memories yet"
          subtitle="Start writing your story together."
          actionLabel="Add memory"
          onAction={() => navigate("/memory/new")}
        />
      ) : (
        grouped.map(([date, items]) => (
          <section key={date}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-dim">{dayLabel(date)}</h2>
            <div className="space-y-3">
              {items.map((m) => (
                <MemoryCard key={m.id} memory={m} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
