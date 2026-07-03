import type { DiagnosisResult, PostureFinding } from "../types";
import { SKELETAL_TYPE_LABELS } from "../types";
import { SKELETAL_ADVICE, nutrientGeneralAdvice } from "../lib/recommendations";

const SEVERITY_STYLE: Record<PostureFinding["severity"], string> = {
  low: "bg-yellow-50 text-yellow-700 border-yellow-200",
  mid: "bg-orange-50 text-orange-700 border-orange-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

const SEVERITY_LABEL: Record<PostureFinding["severity"], string> = {
  low: "軽度",
  mid: "中程度",
  high: "要注意",
};

interface Props {
  result: DiagnosisResult;
  onRestart: () => void;
}

export function ResultView({ result, onRestart }: Props) {
  const advice = SKELETAL_ADVICE[result.skeletalType];
  const scores = result.skeletalScores;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 pb-16">
      <section className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm">
        <div className="text-xs font-medium text-violet-400">骨格診断の結果</div>
        <h2 className="mt-1 text-2xl font-bold text-violet-900">
          {SKELETAL_TYPE_LABELS[result.skeletalType]}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{advice.summary}</p>

        <div className="mt-4 space-y-2">
          {(["straight", "wave", "natural"] as const).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-gray-500">{SKELETAL_TYPE_LABELS[key]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-50">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${scores[key]}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-gray-400">{scores[key]}%</span>
            </div>
          ))}
        </div>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
          {advice.characteristics.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm">
        <h3 className="text-lg font-bold text-violet-900">姿勢チェック</h3>
        {result.postureFindings.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">目立った姿勢の歪みは検出されませんでした。</p>
        ) : (
          <div className="mt-3 space-y-2">
            {result.postureFindings.map((f) => (
              <div key={f.id} className={`rounded-xl border p-3 text-sm ${SEVERITY_STYLE[f.severity]}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>{f.label}</span>
                  <span className="text-xs">{SEVERITY_LABEL[f.severity]}</span>
                </div>
                <p className="mt-1 text-xs opacity-90">{f.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm">
        <h3 className="text-lg font-bold text-violet-900">おすすめの運動</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
          {advice.exercises.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-white p-6 text-left shadow-sm">
        <h3 className="text-lg font-bold text-violet-900">おすすめの栄養素</h3>
        <div className="mt-3 space-y-2">
          {advice.nutrients.map((n) => (
            <div key={n.name} className="text-sm">
              <span className="font-semibold text-violet-700">{n.name}</span>
              <span className="text-gray-500"> ー {n.reason}</span>
            </div>
          ))}
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-500">
          {nutrientGeneralAdvice().map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-gray-400">
        ※本診断は写真から推定した簡易的な目安であり、医療的な診断ではありません。専門的な判断が必要な場合は専門家にご相談ください。
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="mx-auto rounded-full border border-violet-200 px-6 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
      >
        もう一度診断する
      </button>
    </div>
  );
}
