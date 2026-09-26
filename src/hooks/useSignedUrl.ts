import { useEffect, useState } from "react";
import { supabase, MEDIA_BUCKET } from "../lib/supabase";

const cache = new Map<string, { url: string; expires: number }>();

export function useSignedUrl(storagePath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storagePath) {
      setUrl(null);
      return;
    }

    const cached = cache.get(storagePath);
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      return;
    }

    supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(storagePath, 60 * 60) // 1 hour
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setUrl(null);
          return;
        }
        cache.set(storagePath, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
        setUrl(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}
