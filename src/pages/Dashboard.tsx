import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useMemories } from "../hooks/useMemories";
import { useOnThisDay } from "../hooks/useOnThisDay";
import { supabase } from "../lib/supabase";
import MemoryCard from "../components/MemoryCard";
import EmptyState from "../components/EmptyState";
import { MemoryCardSkeleton } from "../components/Skeletons";
import { useSignedUrl } from "../hooks/useSignedUrl";
import type { Photo } from "../types/database";

function greetingForHour(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function RecentPhoto({ photo }: { photo: Photo }) {
  const url = useSignedUrl(photo.storage_path);
  if (!url) return <div className="skeleton aspect-square rounded-lg" />;
  return <img src={url} alt={photo.caption ?? ""} className="aspect-square w-full rounded-lg object-cover" />;
}

export default function Dashboard() {
  const { profile, couple, partner } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { memories: todayMemories, loading: loadingToday } = useMemories({ date: today });
  const { memories: recent, loading: loadingRecent } = useMemories({ limit: 4 });
  const { memories: onThisDay } = useOnThisDay();

  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (!couple) return;
    supabase
      .from("photos")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecentPhotos(data ?? []));
  }, [couple]);

  const daysTogether = couple?.relationship_start_date
    ? differenceInDays(new Date(), new Date(couple.relationship_start_date))
    : null;

  const nextAnniversary = (() => {
    if (!couple?.anniversary_date) return null;
    const base = new Date(couple.anniversary_date);
    const now = new Date();
    const next = new Date(now.getFullYear(), base.getMonth(), base.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return next;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-riseIn flex items-start justify-between">
        <div>
          <p className="text-xs text-dim">🔒 Private — Ester &amp; Kypher only</p>
          <h1 className="mt-1 font-display text-2xl">
            {greetingForHour(new Date().getHours())}, {profile?.full_name} ❤️
          </h1>
          <p className="text-sm text-dim">Another day in our story.</p>
        </div>
        <Link
          to="/search"
          aria-label="Search memories"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline text-sm transition hover:bg-surface-raised"
        >
          🔍
        </Link>
      </div>

      {/* Counter card */}
      <div className="glass animate-riseIn rounded-soft p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-3 text-2xl">
          <span>{profile?.full_name?.[0] ?? "E"}</span>
          <span className="heart-beat">❤️</span>
          <span>{partner?.full_name?.[0] ?? "K"}</span>
        </div>
        {daysTogether !== null ? (
          <>
            <p className="font-display text-4xl">{daysTogether}</p>
            <p className="text-sm text-dim">days together</p>
          </>
        ) : (
          <p className="text-sm text-dim">Add your relationship start date in your profile.</p>
        )}
        {nextAnniversary && (
          <p className="mt-3 text-xs text-dim">
            Next anniversary · {format(nextAnniversary, "MMMM d")} ({differenceInDays(nextAnniversary, new Date())}{" "}
            days away)
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/memory/new")}
          className="rounded-soft bg-rose px-4 py-3.5 text-left text-sm font-medium text-white transition hover:bg-rose-dark"
        >
          ❤️ Add memory
        </button>
        <button
          onClick={() => navigate("/gallery?upload=1")}
          className="rounded-soft border border-hairline px-4 py-3.5 text-left text-sm font-medium transition hover:bg-surface-raised"
        >
          📸 Upload photo
        </button>
      </div>

      {/* On this day */}
      {onThisDay.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg">On This Day ❤️</h2>
          <div className="space-y-3">
            {onThisDay.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      <section>
        <h2 className="mb-3 font-display text-lg">Today's memories</h2>
        {loadingToday ? (
          <MemoryCardSkeleton />
        ) : todayMemories.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="No memories yet today"
            subtitle="Maybe it's time to add one."
            actionLabel="Add memory"
            onAction={() => navigate("/memory/new")}
          />
        ) : (
          <div className="space-y-3">
            {todayMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </section>

      {/* Recent photos */}
      {recentPhotos.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent photos</h2>
            <Link to="/gallery" className="text-xs text-rose">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {recentPhotos.map((p) => (
              <RecentPhoto key={p.id} photo={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent activity / memories */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Recent memories</h2>
          <Link to="/timeline" className="text-xs text-rose">
            View timeline
          </Link>
        </div>
        {loadingRecent ? (
          <div className="space-y-3">
            <MemoryCardSkeleton />
            <MemoryCardSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState icon="📖" title="Your story starts here" subtitle="Add your first memory together." />
        ) : (
          <div className="space-y-3">
            {recent.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
