import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import MemoryCard from "../components/MemoryCard";
import type { Memory } from "../types/database";

export default function MemoryDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("memories")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setMemory((data as Memory) ?? null);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!memory) return;
    if (!confirm("Delete this memory? This can't be undone.")) return;
    setDeleting(true);
    await supabase.from("memories").delete().eq("id", memory.id);
    navigate("/timeline");
  }

  if (loading) return <div className="skeleton h-40 rounded-soft" />;
  if (!memory) return <p className="text-sm text-dim">This memory couldn't be found.</p>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-dim hover:text-current">
        ‹ Back
      </button>

      <MemoryCard memory={memory} />

      {memory.day_summary && (
        <div className="rounded-soft border border-hairline bg-surface p-5">
          <p className="mb-1 text-xs text-dim">How the day went</p>
          <p className="text-sm">{memory.day_summary}</p>
        </div>
      )}

      {memory.note_to_partner && (
        <div className="rounded-soft border border-gold/30 bg-gold/5 p-5">
          <p className="mb-1 text-xs text-gold">A note for you</p>
          <p className="text-sm">{memory.note_to_partner}</p>
        </div>
      )}

      <p className="text-xs text-dim">
        Written {format(new Date(memory.created_at), "MMMM d, yyyy 'at' h:mm a")}
      </p>

      {memory.author_id === profile?.id && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-rose hover:underline disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete this memory"}
        </button>
      )}
    </div>
  );
}
