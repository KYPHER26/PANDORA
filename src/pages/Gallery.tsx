import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { supabase, MEDIA_BUCKET } from "../lib/supabase";
import { notifyPartner } from "../hooks/useNotifications";
import { useSignedUrl } from "../hooks/useSignedUrl";
import EmptyState from "../components/EmptyState";
import { GridSkeleton } from "../components/Skeletons";
import PhotoUploader, { type PendingPhoto } from "../components/PhotoUploader";
import type { Photo } from "../types/database";

function GalleryThumb({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const url = useSignedUrl(photo.storage_path);
  if (!url) return <div className="skeleton aspect-square rounded-lg" />;
  return (
    <button onClick={onClick} className="block aspect-square overflow-hidden rounded-lg">
      <img src={url} alt={photo.caption ?? ""} className="h-full w-full object-cover transition hover:scale-105" />
    </button>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const photo = photos[index];
  const url = useSignedUrl(photo.storage_path);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 text-2xl text-white/80" aria-label="Close">
        ✕
      </button>
      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          className="absolute left-2 text-3xl text-white/70 md:left-6"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          className="absolute right-2 text-3xl text-white/70 md:right-6"
          aria-label="Next photo"
        >
          ›
        </button>
      )}
      {url ? (
        <img
          src={url}
          alt={photo.caption ?? ""}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
        />
      ) : (
        <div className="skeleton h-64 w-64 rounded-lg" />
      )}
      {photo.caption && <p className="mt-3 text-sm text-white/80">{photo.caption}</p>}
    </div>
  );
}

export default function Gallery() {
  const { profile, couple, partner } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(searchParams.get("upload") === "1");
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetchPhotos() {
    if (!couple) return;
    setLoading(true);
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("couple_id", couple.id)
      .order("taken_on", { ascending: false });
    setPhotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple]);

  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      const key = format(new Date(p.taken_on ?? p.created_at), "MMMM yyyy");
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return Array.from(map.entries());
  }, [photos]);

  async function handleUpload() {
    if (!profile || !couple || pending.length === 0) return;
    setUploading(true);
    for (const p of pending) {
      const ext = p.file.name.split(".").pop() ?? "jpg";
      const path = `${couple.id}/gallery/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, p.file, { upsert: false });
      if (error) continue;
      await supabase.from("photos").insert({
        couple_id: couple.id,
        uploader_id: profile.id,
        storage_path: path,
        caption: p.caption || null,
        taken_on: new Date().toISOString().slice(0, 10),
      });
    }
    if (partner) {
      await notifyPartner({
        recipientId: partner.id,
        senderId: profile.id,
        coupleId: couple.id,
        type: "new_photo",
        message: `${profile.full_name} added ${pending.length} photo${pending.length > 1 ? "s" : ""} to the gallery`,
      });
    }
    setPending([]);
    setShowUpload(false);
    setUploading(false);
    setSearchParams({});
    fetchPhotos();
  }

  async function deletePhoto(photo: Photo) {
    if (photo.uploader_id !== profile?.id) return;
    await supabase.storage.from(MEDIA_BUCKET).remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    setLightboxIndex(null);
    fetchPhotos();
  }

  const flatPhotos = grouped.flatMap(([, items]) => items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Our Gallery 📸</h1>
          <p className="text-sm text-dim">Every photo, organized by month.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="rounded-pill bg-rose px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-dark"
        >
          + Upload
        </button>
      </div>

      {showUpload && (
        <div className="rounded-soft border border-hairline bg-surface p-4">
          <PhotoUploader photos={pending} onChange={setPending} />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpload}
              disabled={pending.length === 0 || uploading}
              className="rounded-pill bg-rose px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {uploading ? "Uploading…" : `Save ${pending.length || ""} photo${pending.length === 1 ? "" : "s"}`}
            </button>
            <button
              onClick={() => {
                setShowUpload(false);
                setPending([]);
                setSearchParams({});
              }}
              className="rounded-pill border border-hairline px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <GridSkeleton count={9} />
      ) : photos.length === 0 ? (
        <EmptyState
          icon="📸"
          title="Our gallery is waiting for memories"
          actionLabel="Upload photo"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        grouped.map(([month, items]) => (
          <section key={month}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-dim">{month}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {items.map((p) => (
                <GalleryThumb key={p.id} photo={p} onClick={() => setLightboxIndex(flatPhotos.indexOf(p))} />
              ))}
            </div>
          </section>
        ))
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={flatPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {lightboxIndex !== null && flatPhotos[lightboxIndex]?.uploader_id === profile?.id && (
        <button
          onClick={() => deletePhoto(flatPhotos[lightboxIndex])}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-rose px-4 py-2 text-sm text-white"
        >
          Delete photo
        </button>
      )}
    </div>
  );
}
