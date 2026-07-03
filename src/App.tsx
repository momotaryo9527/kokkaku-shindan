import { useState } from "react";
import type { DiagnosisResult, PhotoAngle, PhotoSlots } from "./types";
import { PHOTO_ANGLE_LABELS } from "./types";
import { PhotoSlotCard } from "./components/PhotoSlotCard";
import { ResultView } from "./components/ResultView";
import { detectLandmarks } from "./lib/poseDetector";
import { runDiagnosis } from "./lib/diagnosis";

const ANGLES: PhotoAngle[] = ["front", "side", "back"];

type Step = "intro" | "upload" | "analyzing" | "result" | "error";

function App() {
  const [step, setStep] = useState<Step>("intro");
  const [photos, setPhotos] = useState<PhotoSlots>({});
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const allPhotosReady = ANGLES.every((a) => photos[a]);

  function updatePhoto(angle: PhotoAngle, dataUrl: string) {
    setPhotos((prev) => ({ ...prev, [angle]: dataUrl }));
  }

  function clearPhoto(angle: PhotoAngle) {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[angle];
      return next;
    });
  }

  async function runAnalysis() {
    setStep("analyzing");
    setErrorMessage("");
    try {
      const [front, side, back] = await Promise.all(
        ANGLES.map((a) => detectLandmarks(photos[a] as string)),
      );

      if (!front || !side || !back) {
        setErrorMessage(
          "体全体をうまく検出できませんでした。全身が写るように撮り直してから、もう一度お試しください。",
        );
        setStep("error");
        return;
      }

      const diagnosis = runDiagnosis({ front, side, back });
      setResult(diagnosis);
      setStep("result");
    } catch (err) {
      console.error(err);
      setErrorMessage("解析中にエラーが発生しました。時間をおいて再度お試しください。");
      setStep("error");
    }
  }

  function restart() {
    setPhotos({});
    setResult(null);
    setErrorMessage("");
    setStep("upload");
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-surface px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-violet-900">骨格診断アプリ</h1>
        <p className="mt-2 text-sm text-gray-500">
          正面・側面・背面の写真から骨格タイプと姿勢をかんたん診断
        </p>
      </header>

      {step === "intro" && (
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            体にフィットした服装で、正面・側面・背面の全身が写る写真を3枚用意してください。
            写真はブラウザ内で解析され、外部サーバーには送信されません。
          </p>
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            はじめる
          </button>
        </div>
      )}

      {step === "upload" && (
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-4">
            {ANGLES.map((angle) => (
              <PhotoSlotCard
                key={angle}
                angle={angle}
                imageUrl={photos[angle]}
                onChange={(dataUrl) => updatePhoto(angle, dataUrl)}
                onClear={() => clearPhoto(angle)}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!allPhotosReady}
            onClick={runAnalysis}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-violet-200 hover:enabled:bg-brand-dark"
          >
            {allPhotosReady
              ? "診断する"
              : `あと${ANGLES.filter((a) => !photos[a]).length}枚(${ANGLES.filter((a) => !photos[a])
                  .map((a) => PHOTO_ANGLE_LABELS[a])
                  .join("・")})`}
          </button>
        </div>
      )}

      {step === "analyzing" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-brand" />
          <p className="text-sm text-gray-500">写真を解析しています...</p>
        </div>
      )}

      {step === "error" && (
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="rounded-full border border-violet-200 px-6 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
          >
            写真を選び直す
          </button>
        </div>
      )}

      {step === "result" && result && <ResultView result={result} onRestart={restart} />}
    </div>
  );
}

export default App;
