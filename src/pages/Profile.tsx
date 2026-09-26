import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, MEDIA_BUCKET } from "../lib/supabase";
import { useSignedUrl } from "../hooks/useSignedUrl";
import { useNotifications } from "../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import ThemeToggle from "../components/ThemeToggle";

function Avatar({ path, name }: { path: string | null; name?: string }) {
  const url = useSignedUrl(path);
  if (url) return <img src={url} alt={name} className="h-16 w-16 rounded-full object-cover" />;
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose/20 text-xl font-display">
      {name?.[0] ?? "?"}
    </div>
  );
}

export default function Profile() {
  const { profile, partner, couple, signOut, refreshProfile } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [relStart, setRelStart] = useState(couple?.relationship_start_date ?? "");
  const [anniversary, setAnniversary] = useState(couple?.anniversary_date ?? "");
  const [quote, setQuote] = useState(couple?.quote ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveCoupleDetails() {
    if (!couple) return;
    setSaving(true);
    await supabase
      .from("couples")
      .update({
        relationship_start_date: relStart || null,
        anniversary_date: anniversary || null,
        quote: quote || null,
      })
      .eq("id", couple.id);
    await refreshProfile();
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || !couple) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${couple.id}/avatars/${profile.id}.${ext}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true });
    if (!error) {
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", profile.id);
      await refreshProfile();
    }
    setUploading(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Profile</h1>
        <p className="text-sm text-dim">🔒 Private — Ester &amp; Kypher only</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <label className="cursor-pointer">
            <Avatar path={profile?.avatar_url ?? null} name={profile?.full_name} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <p className="mt-1 text-xs text-dim">{uploading ? "Uploading…" : "You"}</p>
        </div>
        <span className="text-xl">❤️</span>
        <div className="text-center">
          <Avatar path={partner?.avatar_url ?? null} name={partner?.full_name} />
          <p className="mt-1 text-xs text-dim">{partner?.full_name ?? "Partner"}</p>
        </div>
      </div>

      <section className="space-y-3 rounded-soft border border-hairline bg-surface p-5">
        <h2 className="font-display text-lg">Our relationship</h2>
        <div>
          <label className="mb-1 block text-xs text-dim">Relationship start date</label>
          <input
            type="date"
            value={relStart}
            onChange={(e) => setRelStart(e.target.value)}
            className="rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm outline-none focus:border-rose"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-dim">Anniversary date</label>
          <input
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            className="rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm outline-none focus:border-rose"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-dim">A quote about us</label>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Our story, our memories, our space."
            className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm outline-none focus:border-rose"
          />
        </div>
        <button
          onClick={saveCoupleDetails}
          disabled={saving}
          className="rounded-pill bg-rose px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </section>

      <section className="rounded-soft border border-hairline bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-rose">
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-dim">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className={`text-sm ${n.is_read ? "text-dim" : ""}`}>
                <p>{n.message}</p>
                <p className="text-xs text-dim">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between rounded-soft border border-hairline bg-surface p-5">
        <div>
          <p className="text-sm font-medium">Appearance</p>
          <p className="text-xs text-dim">Light or dark, your call.</p>
        </div>
        <ThemeToggle />
      </div>

      <button
        onClick={() => signOut()}
        className="w-full rounded-pill border border-hairline py-3 text-sm font-medium transition hover:bg-surface-raised"
      >
        Sign out
      </button>
    </div>
  );
}
