import type { CheckPart, DiagnosisResult, SkeletalType } from "../types";
import { normalizeScores, pickTopSkeletalType } from "./diagnosis";

export const SELF_CHECK_PHOTO_HINT: Record<CheckPart, string> = {
  collarbone: "襟ぐりの広い服を着るか鏡の前で、鎖骨まわりが写るように接写してください",
  wrist: "反対の手のひらと並べて、手首全体が写るように接写してください",
  knee: "膝を軽く曲げ、お皿の部分が正面から写るように接写してください",
  ear: "髪をよけて、耳全体が横から写るように接写してください",
};

export interface SelfCheckOption {
  id: string;
  text: string;
  scores: Partial<Record<SkeletalType, number>>;
}

export interface SelfCheckQuestion {
  part: CheckPart;
  question: string;
  options: SelfCheckOption[];
}

// 骨格診断のセルフチェックとして広く紹介されている一般的な着眼点(鎖骨・手首・膝・耳の見え方)を
// もとにした簡易版。専門家による触診に代わるものではなく、あくまで目安。
export const SELF_CHECK_QUESTIONS: SelfCheckQuestion[] = [
  {
    part: "collarbone",
    question: "鎖骨まわりの写真を見て、一番近いものを選んでください",
    options: [
      {
        id: "straight",
        text: "鎖骨が肉に埋もれ気味で目立ちにくく、まっすぐ横に通っている",
        scores: { straight: 2 },
      },
      {
        id: "wave",
        text: "鎖骨が小さく華奢で、鎖骨の上あたりがくぼんで見える",
        scores: { wave: 2 },
      },
      {
        id: "natural",
        text: "鎖骨が大きくしっかり浮き出ていて、骨の輪郭がはっきり見える",
        scores: { natural: 2 },
      },
    ],
  },
  {
    part: "wrist",
    question: "手首の写真を見て、一番近いものを選んでください",
    options: [
      {
        id: "straight",
        text: "手首は丸みがあり、骨よりも肉感のある太さを感じる",
        scores: { straight: 2 },
      },
      {
        id: "wave",
        text: "手首が細く華奢で、骨も小さい",
        scores: { wave: 2 },
      },
      {
        id: "natural",
        text: "手首の骨がゴツゴツして目立ち、関節が大きく見える",
        scores: { natural: 2 },
      },
    ],
  },
  {
    part: "knee",
    question: "膝の写真を見て、一番近いものを選んでください",
    options: [
      {
        id: "straight",
        text: "膝のお皿は小さめで、その上に程よく肉がついている",
        scores: { straight: 2 },
      },
      {
        id: "wave",
        text: "膝のお皿が小さく平らで、あまり目立たない",
        scores: { wave: 2 },
      },
      {
        id: "natural",
        text: "膝のお皿が大きく、骨張ってしっかりして見える",
        scores: { natural: 2 },
      },
    ],
  },
  {
    part: "ear",
    question: "耳の写真を見て、一番近いものを選んでください(補助的な判断材料です)",
    options: [
      {
        id: "straight",
        text: "耳は体格に対して標準〜小さめで、丸みがある",
        scores: { straight: 1 },
      },
      {
        id: "wave",
        text: "耳たぶが柔らかく小さめで、平面的な印象",
        scores: { wave: 1 },
      },
      {
        id: "natural",
        text: "耳が大きめで、輪郭がしっかりしている",
        scores: { natural: 1 },
      },
    ],
  },
];

export type SelfCheckAnswers = Partial<Record<CheckPart, string>>;

export function runSelfCheckDiagnosis(answers: SelfCheckAnswers): DiagnosisResult {
  const scores: Record<SkeletalType, number> = { straight: 0, wave: 0, natural: 0 };

  for (const question of SELF_CHECK_QUESTIONS) {
    const selectedId = answers[question.part];
    const option = question.options.find((o) => o.id === selectedId);
    if (!option) continue;
    for (const [type, points] of Object.entries(option.scores) as [SkeletalType, number][]) {
      scores[type] += points;
    }
  }

  return {
    skeletalType: pickTopSkeletalType(scores),
    skeletalScores: normalizeScores(scores),
    postureFindings: [],
    postureChecked: false,
  };
}
