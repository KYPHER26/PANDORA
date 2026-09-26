import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Memory, Photo } from "../types/database";
import { useSignedUrl } from "../hooks/useSignedUrl";

function MilestonePhoto({ path }: { path: string }) {
  const url = useSignedUrl(path);
  if (!url) return <div className="skeleton h-20 w-20 rounded-lg" />;
  return <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />;
}

interface Milestone {
  icon: string;
  title: string;
  date?: string;
  description?: string;
  photos?: Photo[];
}

export default function OurStory() {
  const { couple } = useAuth();
  const [firstPhotos, setFirstPhotos] = useState<Photo[]>([]);
  const [specialMemories, setSpecialMemories] = useState<Memory[]>([]);
  const [tripMemories, setTripMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!couple) return;
    supabase
      .from("photos")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: true })
      .limit(4)
      .then(({ data }) => setFirstPhotos(data ?? []));

    supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("is_special", true)
      .order("date", { ascending: true })
      .then(({ data }) => setSpecialMemories(data ?? []));

    supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .or("special_label.eq.First trip,tags.cs.{trip}")
      .order("date", { ascending: true })
      .then(({ data }) => setTripMemories(data ?? []));
  }, [couple]);

  const anniversaryMemory = specialMemories.find((m) => m.special_label === "Anniversary");

  const milestones: Milestone[] = [
    {
      icon: "❤️",
      title: "The Beginning",
      date: couple?.relationship_start_date ? format(new Date(couple.relationship_start_date), "MMMM d, yyyy") : undefined,
      description: couple?.quote ?? "Where our story began.",
    },
    {
      icon: "📸",
      title: "First Memories",
      description: firstPhotos.length ? "The first moments we captured together." : "No photos yet — start uploading.",
      photos: firstPhotos,
    },
    {
      icon: "❤️",
      title: "First Anniversary",
      date: anniversaryMemory ? format(new Date(anniversaryMemory.date), "MMMM d, yyyy") : undefined,
      description: anniversaryMemory?.title ?? "Not marked yet.",
    },
    {
      icon: "✈️",
      title: "Special Moments",
      description:
        tripMemories.length > 0
          ? `${tripMemories.length} trip${tripMemories.length > 1 ? "s" : ""} and special memories so far.`
          : "Trips and important memories will show up here.",
    },
    {
      icon: "❤️",
      title: "Today",
      description: "Continue writing the story.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl">Our Story</h1>
          <p className="text-sm text-dim">The milestones that made us, us.</p>
        </div>
        <Link to="/special" className="mt-1 shrink-0 text-xs text-rose">
          Special memories ❤️
        </Link>
      </div>

      <div className="relative pl-8">
        <div className="absolute bottom-4 left-3.5 top-4 w-px bg-hairline" />
        <div className="space-y-8">
          {milestones.map((m, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full bg-rose/15 text-sm">
                {m.icon}
              </span>
              <p className="font-display text-lg">{m.title}</p>
              {m.date && <p className="text-xs text-dim">{m.date}</p>}
              {m.description && <p className="mt-1 text-sm text-dim">{m.description}</p>}
              {m.photos && m.photos.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {m.photos.map((p) => (
                    <MilestonePhoto key={p.id} path={p.storage_path} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
