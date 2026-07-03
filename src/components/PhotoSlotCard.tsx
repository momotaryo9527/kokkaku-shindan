import { useRef } from "react";
import type { PhotoAngle } from "../types";
import { PHOTO_ANGLE_LABELS } from "../types";

const ANGLE_HINT: Record<PhotoAngle, string> = {
  front: "腕を軽く広げ、体全体が写るように正面を向いて撮影してください",
  side: "体の側面(横向き)全体が写るように撮影してください",
  back: "背中側から体全体が写るように撮影してください",
};

interface Props {
  angle: PhotoAngle;
  imageUrl?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}

export function PhotoSlotCard({ angle, imageUrl, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-violet-900">
        {PHOTO_ANGLE_LABELS[angle]}の写真
      </div>

      <div className="flex h-56 w-40 items-center justify-center overflow-hidden rounded-xl bg-violet-50">
        {imageUrl ? (
          <img src={imageUrl} alt={`${PHOTO_ANGLE_LABELS[angle]}の写真`} className="h-full w-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-violet-300">{ANGLE_HINT[angle]}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {imageUrl ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-violet-200 px-4 py-1.5 text-xs font-medium text-violet-500 hover:bg-violet-50"
        >
          撮り直す
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
        >
          写真を選択・撮影
        </button>
      )}
    </div>
  );
}
