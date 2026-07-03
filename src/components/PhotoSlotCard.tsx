import { useRef } from "react";

interface Props {
  label: string;
  hint: string;
  imageUrl?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}

export function PhotoSlotCard({ label, hint, imageUrl, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-violet-900">{label}</div>

      <div className="flex h-56 w-40 items-center justify-center overflow-hidden rounded-xl bg-violet-50">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-violet-300">{hint}</span>
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
