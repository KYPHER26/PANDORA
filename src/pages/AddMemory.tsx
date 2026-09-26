import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, MEDIA_BUCKET } from "../lib/supabase";
import { notifyPartner } from "../hooks/useNotifications";
import { MOODS } from "../types/database";
import PhotoUploader, { type PendingPhoto } from "../components/PhotoUploader";

const SPECIAL_PRESETS = [
  "First meeting",
  "First date",
  "Anniversary",
  "Birthday",
  "First trip",
  "Achievement",
  "Favorite day",
  "Funny moment",
];

export default function AddMemory() {
  const { profile, couple, partner } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [whatIDid, setWhatIDid] = useState("");
  const [howMyDayWent, setHowMyDayWent] = useState("");
  const [noteToPartner, setNoteToPartner] = useState("");
  const [mood, setMood] = useState<string>("");
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSpecial, setIsSpecial] = useState(false);
  const [specialLabel, setSpecialLabel] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addTag() {
    const clean = tagInput.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) setTags((t) => [...t, clean]);
    setTagInput("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !couple) return;
    if (!title.trim()) {
      setError("Give this memory a title.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const { data: memory, error: memErr } = await supabase
        .from("memories")
        .insert({
          couple_id: couple.id,
          author_id: profile.id,
          title: title.trim(),
          content: whatIDid.trim() || null,
          day_summary: howMyDayWent.trim() || null,
          note_to_partner: noteToPartner.trim() || null,
          date,
          mood: mood || null,
          location: location.trim() || null,
          tags,
          is_special: isSpecial,
          special_label: isSpecial ? specialLabel || null : null,
        })
        .select()
        .single();

      if (memErr || !memory) throw new Error(memErr?.message ?? "Could not save memory.");

      for (const p of photos) {
        const ext = p.file.name.split(".").pop() ?? "jpg";
        const path = `${couple.id}/${memory.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, p.file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadErr) continue; // skip failed upload, keep going with the rest
        await supabase.from("photos").insert({
          couple_id: couple.id,
          uploader_id: profile.id,
          memory_id: memory.id,
          storage_path: path,
          caption: p.caption || null,
          taken_on: date,
        });
      }

      if (partner) {
        await notifyPartner({
          recipientId: partner.id,
          senderId: profile.id,
          coupleId: couple.id,
          type: "new_memory",
          message: `${profile.full_name} added a new memory: "${title.trim()}"`,
          referenceId: memory.id,
        });
      }

      navigate(`/memory/${memory.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving your memory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-6">
      <h1 className="mb-5 font-display text-2xl">Create memory ❤️</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-xs text-dim">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-dim">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My day"
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-dim">What did you do today?</label>
          <textarea
            value={whatIDid}
            onChange={(e) => setWhatIDid(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-dim">How was your day?</label>
          <textarea
            value={howMyDayWent}
            onChange={(e) => setHowMyDayWent(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-dim">Something you want your partner to know</label>
          <textarea
            value={noteToPartner}
            onChange={(e) => setNoteToPartner(e.target.value)}
            rows={2}
            placeholder="A little note, just for them…"
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs text-dim">Mood</label>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(mood === m ? "" : m)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl transition ${
                  mood === m ? "border-rose bg-rose/15" : "border-hairline"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-dim">Location (optional)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where were you?"
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs text-dim">Add photos</label>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-dim">Tags</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="beach, trip, birthday…"
              className="flex-1 rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-sm outline-none focus:border-rose"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg border border-hairline px-4 text-sm transition hover:bg-surface-raised"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs text-dim"
                >
                  #{t} ✕
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} />
          Mark as a special memory ❤️
        </label>

        {isSpecial && (
          <div>
            <label className="mb-2 block text-xs text-dim">What kind of special memory?</label>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setSpecialLabel(preset)}
                  className={`rounded-pill border px-3 py-1.5 text-xs transition ${
                    specialLabel === preset ? "border-gold bg-gold/15 text-gold" : "border-hairline text-dim"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-pill bg-rose py-3 text-sm font-medium text-white transition hover:bg-rose-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save memory ❤️"}
        </button>
      </form>
    </div>
  );
}
