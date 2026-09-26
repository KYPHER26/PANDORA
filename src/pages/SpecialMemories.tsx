import { useNavigate } from "react-router-dom";
import { useMemories } from "../hooks/useMemories";
import MemoryCard from "../components/MemoryCard";
import EmptyState from "../components/EmptyState";
import { MemoryCardSkeleton } from "../components/Skeletons";

export default function SpecialMemories() {
  const { memories, loading } = useMemories({ specialOnly: true });
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Our Special Memories ❤️</h1>
        <p className="text-sm text-dim">The moments worth remembering forever.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <MemoryCardSkeleton />
          <MemoryCardSkeleton />
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No special memories marked yet"
          subtitle="Mark a memory as special to see it here."
          actionLabel="Add memory"
          onAction={() => navigate("/memory/new")}
        />
      ) : (
        <div className="space-y-3">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}
