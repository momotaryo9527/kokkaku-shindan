import { useState } from "react";
import type { CheckPart, DiagnosisResult, PhotoAngle, PhotoSlots } from "./types";
import { CHECK_PART_LABELS, PHOTO_ANGLE_LABELS } from "./types";
import { PhotoSlotCard } from "./components/PhotoSlotCard";
import { ResultView } from "./components/ResultView";
import { detectLandmarks } from "./lib/poseDetector";
import { runDiagnosis } from "./lib/diagnosis";
import {
  SELF_CHECK_PHOTO_HINT,
  SELF_CHECK_QUESTIONS,
  runSelfCheckDiagnosis,
  type SelfCheckAnswers,
} from "./lib/selfCheck";

const ANGLES: PhotoAngle[] = ["front", "side", "back"];
const CHECK_PARTS: CheckPart[] = ["collarbone", "wrist", "knee", "ear"];

const ANGLE_HINT: Record<PhotoAngle, string> = {
  front: "腕を軽く広げ、体全体が写るように正面を向いて撮影してください",
  side: "体の側面(横向き)全体が写るように撮影してください",
  back: "背中側から体全体が写るように撮影してください",
};

type Step =
  | "intro"
  | "mode-select"
  | "upload"
  | "analyzing"
  | "selfie-photos"
  | "selfie-quiz"
  | "result"
  | "error";

function App() {
  const [step, setStep] = useState<Step>("intro");
  const [photos, setPhotos] = useState<PhotoSlots>({});
  const [selfiePhotos, setSelfiePhotos] = useState<Partial<Record<CheckPart, string>>>({});
  const [selfieAnswers, setSelfieAnswers] = useState<SelfCheckAnswers>({});
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const allPhotosReady = ANGLES.every((a) => photos[a]);
  const allSelfiePhotosReady = CHECK_PARTS.every((p) => selfiePhotos[p]);
  const allAnswered = SELF_CHECK_QUESTIONS.every((q) => selfieAnswers[q.part]);

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

  function updateSelfiePhoto(part: CheckPart, dataUrl: string) {
    setSelfiePhotos((prev) => ({ ...prev, [part]: dataUrl }));
  }

  function clearSelfiePhoto(part: CheckPart) {
    setSelfiePhotos((prev) => {
      const next = { ...prev };
      delete next[part];
      return next;
    });
  }

  function selectAnswer(part: CheckPart, optionId: string) {
    setSelfieAnswers((prev) => ({ ...prev, [part]: optionId }));
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

  function submitSelfCheck() {
    setResult(runSelfCheckDiagnosis(selfieAnswers));
    setStep("result");
  }

  function restart() {
    setPhotos({});
    setSelfiePhotos({});
    setSelfieAnswers({});
    setResult(null);
    setErrorMessage("");
    setStep("mode-select");
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-surface px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-violet-900">骨格診断アプリ</h1>
        <p className="mt-2 text-sm text-gray-500">
          写真から骨格タイプと姿勢をかんたん診断
        </p>
      </header>

      {step === "intro" && (
        <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            写真はブラウザ内で解析され、外部サーバーには送信されません。
          </p>
          <button
            type="button"
            onClick={() => setStep("mode-select")}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            はじめる
          </button>
        </div>
      )}

      {step === "mode-select" && (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep("selfie-photos")}
            className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm hover:border-brand"
          >
            <div className="text-base font-bold text-violet-900">自撮りクイック診断</div>
            <p className="mt-1 text-sm text-gray-500">
              鎖骨・手首・膝・耳を自分で接写するだけ。誰かに撮ってもらう必要はありません。
              姿勢チェックは含まれません。
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm hover:border-brand"
          >
            <div className="text-base font-bold text-violet-900">詳細診断(全身3枚)</div>
            <p className="mt-1 text-sm text-gray-500">
              正面・側面・背面の全身写真から骨格タイプに加えて姿勢の歪みまで診断します。
              誰かに撮ってもらうか、三脚・タイマー撮影がおすすめです。
            </p>
          </button>
        </div>
      )}

      {step === "upload" && (
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-4">
            {ANGLES.map((angle) => (
              <PhotoSlotCard
                key={angle}
                label={`${PHOTO_ANGLE_LABELS[angle]}の写真`}
                hint={ANGLE_HINT[angle]}
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

      {step === "selfie-photos" && (
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-4">
            {CHECK_PARTS.map((part) => (
              <PhotoSlotCard
                key={part}
                label={`${CHECK_PART_LABELS[part]}の写真`}
                hint={SELF_CHECK_PHOTO_HINT[part]}
                imageUrl={selfiePhotos[part]}
                onChange={(dataUrl) => updateSelfiePhoto(part, dataUrl)}
                onClear={() => clearSelfiePhoto(part)}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!allSelfiePhotosReady}
            onClick={() => setStep("selfie-quiz")}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-violet-200 hover:enabled:bg-brand-dark"
          >
            {allSelfiePhotosReady
              ? "次へ(質問に答える)"
              : `あと${CHECK_PARTS.filter((p) => !selfiePhotos[p]).length}枚(${CHECK_PARTS.filter(
                  (p) => !selfiePhotos[p],
                )
                  .map((p) => CHECK_PART_LABELS[p])
                  .join("・")})`}
          </button>
        </div>
      )}

      {step === "selfie-quiz" && (
        <div className="flex w-full max-w-2xl flex-col gap-6 pb-10">
          {SELF_CHECK_QUESTIONS.map((q) => (
            <div key={q.part} className="rounded-2xl border border-violet-100 bg-white p-5 text-left shadow-sm">
              <div className="flex gap-4">
                {selfiePhotos[q.part] && (
                  <img
                    src={selfiePhotos[q.part]}
                    alt={CHECK_PART_LABELS[q.part]}
                    className="h-24 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-violet-900">{q.question}</div>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition ${
                          selfieAnswers[q.part] === opt.id
                            ? "border-brand bg-violet-50"
                            : "border-violet-100 hover:bg-violet-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.part}
                          className="mt-0.5"
                          checked={selfieAnswers[q.part] === opt.id}
                          onChange={() => selectAnswer(q.part, opt.id)}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={!allAnswered}
            onClick={submitSelfCheck}
            className="mx-auto rounded-full bg-brand px-8 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-violet-200 hover:enabled:bg-brand-dark"
          >
            診断結果を見る
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
