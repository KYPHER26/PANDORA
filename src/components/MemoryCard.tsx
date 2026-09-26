import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { notifyPartner } from "../hooks/useNotifications";
import { useSignedUrl } from "../hooks/useSignedUrl";
import type { Comment, Memory, Photo, Reaction, ReactionType } from "../types/database";
import { REACTION_EMOJI } from "../types/database";

function PhotoThumb({ path }: { path: string }) {
  const url = useSignedUrl(path);
  if (!url) return <div className="skeleton aspect-square rounded-lg" />;
  return <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />;
}

export default function MemoryCard({ memory, showAuthor = true }: { memory: Memory; showAuthor?: boolean }) {
  const { profile, partner, couple } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isMine = memory.author_id === profile?.id;
  const authorName = isMine ? profile?.full_name : partner?.full_name ?? "Partner";

  useEffect(() => {
    supabase
      .from("photos")
      .select("*")
      .eq("memory_id", memory.id)
      .then(({ data }) => setPhotos(data ?? []));
    supabase
      .from("reactions")
      .select("*")
      .eq("memory_id", memory.id)
      .then(({ data }) => setReactions(data ?? []));
    supabase
      .from("comments")
      .select("*")
      .eq("memory_id", memory.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));
  }, [memory.id]);

  async function toggleReaction(type: ReactionType) {
    if (!profile || !couple) return;
    const existing = reactions.find((r) => r.user_id === profile.id && r.reaction_type === type);
    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      return;
    }
    const { data } = await supabase
      .from("reactions")
      .insert({ memory_id: memory.id, couple_id: couple.id, user_id: profile.id, reaction_type: type })
      .select()
      .single();
    if (data) setReactions((prev) => [...prev, data]);

    if (memory.author_id !== profile.id) {
      notifyPartner({
        recipientId: memory.author_id,
        senderId: profile.id,
        coupleId: couple.id,
        type: "reaction",
        message: `${profile.full_name} reacted ${REACTION_EMOJI[type]} to "${memory.title}"`,
        referenceId: memory.id,
      });
    }
  }

  async function submitComment() {
    if (!profile || !couple || !commentText.trim()) return;
    const { data } = await supabase
      .from("comments")
      .insert({ memory_id: memory.id, couple_id: couple.id, author_id: profile.id, content: commentText.trim() })
      .select()
      .single();
    if (data) setComments((prev) => [...prev, data]);
    setCommentText("");

    if (memory.author_id !== profile.id) {
      notifyPartner({
        recipientId: memory.author_id,
        senderId: profile.id,
        coupleId: couple.id,
        type: "comment",
        message: `${profile.full_name} commented on "${memory.title}"`,
        referenceId: memory.id,
      });
    }
  }

  async function deleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const reactionCounts = (["like", "love", "emotional", "funny"] as ReactionType[]).map((type) => ({
    type,
    count: reactions.filter((r) => r.reaction_type === type).length,
    mine: reactions.some((r) => r.reaction_type === type && r.user_id === profile?.id),
  }));

  return (
    <article className="animate-riseIn rounded-soft border border-hairline bg-surface p-5">
      {showAuthor && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={isMine ? "text-rose" : "text-plum"}>{isMine ? "❤️" : "💗"}</span>
            <span className="text-sm font-medium">{authorName}</span>
            {memory.is_special && (
              <span className="rounded-pill bg-gold/20 px-2 py-0.5 text-[11px] font-medium text-gold">
                ❤️ {memory.special_label || "Special memory"}
              </span>
            )}
          </div>
          <time className="text-xs text-dim">{format(new Date(memory.date), "MMM d, yyyy")}</time>
        </div>
      )}

      <Link to={`/memory/${memory.id}`} className="block">
        <h3 className="font-display text-lg leading-snug">{memory.title}</h3>
        {memory.content && <p className="mt-1.5 text-sm leading-relaxed text-dim">{memory.content}</p>}
      </Link>

      {(memory.mood || memory.location) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {memory.mood && <span>{memory.mood}</span>}
          {memory.location && <span className="text-dim">📍 {memory.location}</span>}
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {photos.slice(0, 6).map((p) => (
            <PhotoThumb key={p.id} path={p.storage_path} />
          ))}
        </div>
      )}

      {memory.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {memory.tags.map((tag) => (
            <span key={tag} className="rounded-pill bg-surface-raised px-2.5 py-0.5 text-xs text-dim">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-1">
          {reactionCounts.map(({ type, count, mine }) => (
            <button
              key={type}
              onClick={() => toggleReaction(type)}
              className={`flex items-center gap-1 rounded-pill px-2 py-1 text-sm transition ${
                mine ? "bg-rose/15" : "hover:bg-surface-raised"
              }`}
            >
              <span className={mine ? "heart-beat" : ""}>{REACTION_EMOJI[type]}</span>
              {count > 0 && <span className="text-xs text-dim">{count}</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1 text-sm text-dim hover:text-current"
        >
          💬 {comments.length > 0 ? comments.length : ""}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-hairline pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
              <p>
                <span className="font-medium">{c.author_id === profile?.id ? "You" : authorName}: </span>
                <span className="text-dim">{c.content}</span>
              </p>
              {c.author_id === profile?.id && (
                <button onClick={() => deleteComment(c.id)} className="shrink-0 text-xs text-dim hover:text-rose">
                  remove
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment…"
              className="flex-1 rounded-pill border border-hairline bg-transparent px-3 py-1.5 text-sm outline-none focus:border-rose"
            />
            <button
              onClick={submitComment}
              className="rounded-pill bg-rose px-3 py-1.5 text-sm text-white transition hover:bg-rose-dark"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
