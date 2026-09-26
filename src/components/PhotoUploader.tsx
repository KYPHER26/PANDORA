import { useRef, useState } from "react";

export interface PendingPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE_MB = 12;

interface PhotoUploaderProps {
  photos: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
}

export default function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);
    const next: PendingPhoto[] = [...photos];

    for (const file of Array.from(fileList)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, WEBP or HEIC photos are allowed.");
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" is larger than ${MAX_SIZE_MB}MB.`);
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file), caption: "" });
    }
    onChange(next);
  }

  function removeAt(index: number) {
    const next = [...photos];
    URL.revokeObjectURL(next[index].previewUrl);
    next.splice(index, 1);
    onChange(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-hairline py-4 text-sm text-dim transition hover:border-rose hover:text-rose"
      >
        + Add photos
      </button>
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.previewUrl} className="relative">
              <img src={p.previewUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
