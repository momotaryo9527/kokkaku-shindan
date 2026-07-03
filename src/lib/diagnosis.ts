import { LANDMARK } from "./landmarks";
import type { DiagnosisResult, LandmarkSet, PostureFinding, SkeletalType } from "../types";

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Softmax-style normalization so the three scores read as a percentage breakdown.
function normalizeScores(scores: Record<SkeletalType, number>): Record<SkeletalType, number> {
  const total = scores.straight + scores.wave + scores.natural;
  if (total <= 0) {
    return { straight: 33, wave: 33, natural: 34 };
  }
  return {
    straight: Math.round((scores.straight / total) * 100),
    wave: Math.round((scores.wave / total) * 100),
    natural: Math.round((scores.natural / total) * 100),
  };
}

function classifySkeletal(front: LandmarkSet): {
  type: SkeletalType;
  scores: Record<SkeletalType, number>;
  shoulderHipRatio: number;
  torsoLegRatio: number;
} {
  const lShoulder = front[LANDMARK.LEFT_SHOULDER];
  const rShoulder = front[LANDMARK.RIGHT_SHOULDER];
  const lHip = front[LANDMARK.LEFT_HIP];
  const rHip = front[LANDMARK.RIGHT_HIP];
  const lAnkle = front[LANDMARK.LEFT_ANKLE];
  const rAnkle = front[LANDMARK.RIGHT_ANKLE];
  const lElbow = front[LANDMARK.LEFT_ELBOW];
  const lWrist = front[LANDMARK.LEFT_WRIST];

  const shoulderWidth = dist(lShoulder, rShoulder);
  const hipWidth = dist(lHip, rHip);
  const shoulderMid = mid(lShoulder, rShoulder);
  const hipMid = mid(lHip, rHip);
  const ankleMid = mid(lAnkle, rAnkle);

  const torsoLength = dist(shoulderMid, hipMid);
  const legLength = dist(hipMid, ankleMid);
  const armLength = dist(lShoulder, lElbow) + dist(lElbow, lWrist);

  const shoulderHipRatio = shoulderWidth / hipWidth;
  const torsoLegRatio = torsoLength / legLength;
  const armTorsoRatio = armLength / torsoLength;

  const scores: Record<SkeletalType, number> = { straight: 0, wave: 0, natural: 0 };

  // 肩幅 vs 骨盤幅: 上重心(肩幅優位)ならストレート寄り、下重心(骨盤幅優位)ならウェーブ寄り
  if (shoulderHipRatio > 1.15) scores.straight += 2;
  else if (shoulderHipRatio < 1.02) scores.wave += 2;
  else scores.natural += 1;

  // 胴/脚の長さ比: 体幹が相対的に長い(＝重心が高く詰まって見える)ほどストレート寄り
  if (torsoLegRatio > 0.95) scores.straight += 2;
  else if (torsoLegRatio < 0.8) scores.wave += 1;

  // 腕/胴の長さ比: 四肢が相対的に長い・関節が目立ちやすいほどナチュラル寄り
  if (armTorsoRatio > 1.3) scores.natural += 2;
  else if (armTorsoRatio < 1.05) scores.wave += 1;

  const type = (Object.keys(scores) as SkeletalType[]).reduce(
    (best, key) => (scores[key] > scores[best] ? key : best),
    "straight" as SkeletalType,
  );

  return { type, scores: normalizeScores(scores), shoulderHipRatio, torsoLegRatio };
}

function analyzeSidePosture(side: LandmarkSet): PostureFinding[] {
  const findings: PostureFinding[] = [];

  const leftEarVisible = (side[LANDMARK.LEFT_EAR].visibility ?? 1) > 0.3;
  const ear = leftEarVisible ? side[LANDMARK.LEFT_EAR] : side[LANDMARK.RIGHT_EAR];
  const shoulder = mid(side[LANDMARK.LEFT_SHOULDER], side[LANDMARK.RIGHT_SHOULDER]);
  const hip = mid(side[LANDMARK.LEFT_HIP], side[LANDMARK.RIGHT_HIP]);
  const ankle = mid(side[LANDMARK.LEFT_ANKLE], side[LANDMARK.RIGHT_ANKLE]);

  const torsoLength = dist(shoulder, hip) || 1;
  const legLength = dist(hip, ankle) || 1;

  const earOffset = Math.abs(ear.x - shoulder.x) / torsoLength;
  const shoulderOffset = Math.abs(shoulder.x - hip.x) / torsoLength;
  const hipOffset = Math.abs(hip.x - ankle.x) / legLength;

  const level = (v: number): "low" | "mid" | "high" | null => {
    if (v > 0.22) return "high";
    if (v > 0.12) return "mid";
    return null;
  };

  const earLevel = level(earOffset);
  if (earLevel) {
    findings.push({
      id: "forward-head",
      label: "頭部前方位(ストレートネック傾向)",
      severity: earLevel,
      detail: "耳の位置が肩より前方にずれています。スマホ・PC作業時の前傾姿勢が影響している可能性があります。",
    });
  }

  const shoulderLevel = level(shoulderOffset);
  if (shoulderLevel) {
    findings.push({
      id: "rounded-shoulders",
      label: "猫背傾向",
      severity: shoulderLevel,
      detail: "肩の位置が骨盤の真上からずれ、背中が丸まりやすい状態です。",
    });
  }

  const hipLevel = level(hipOffset);
  if (hipLevel) {
    findings.push({
      id: "pelvic-tilt",
      label: "骨盤の前後傾向(反り腰・後傾)",
      severity: hipLevel,
      detail: "骨盤が足首の真上からずれています。反り腰または骨盤後傾により腰への負担が増えている可能性があります。",
    });
  }

  return findings;
}

function analyzeBackBalance(back: LandmarkSet): {
  shoulderTilt: number;
  hipTilt: number;
  findings: PostureFinding[];
} {
  const lShoulder = back[LANDMARK.LEFT_SHOULDER];
  const rShoulder = back[LANDMARK.RIGHT_SHOULDER];
  const lHip = back[LANDMARK.LEFT_HIP];
  const rHip = back[LANDMARK.RIGHT_HIP];

  const shoulderWidth = dist(lShoulder, rShoulder) || 1;
  const hipWidth = dist(lHip, rHip) || 1;

  const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y) / shoulderWidth;
  const hipTilt = Math.abs(lHip.y - rHip.y) / hipWidth;

  const findings: PostureFinding[] = [];
  const level = (v: number): "low" | "mid" | "high" | null => {
    if (v > 0.12) return "high";
    if (v > 0.06) return "mid";
    return null;
  };

  const shoulderLevel = level(shoulderTilt);
  if (shoulderLevel) {
    findings.push({
      id: "shoulder-imbalance",
      label: "左右の肩の高さの差",
      severity: shoulderLevel,
      detail: "左右の肩の高さに差があります。日常の姿勢の癖やバッグの持ち方の偏りが影響している可能性があります。",
    });
  }

  const hipLevel = level(hipTilt);
  if (hipLevel) {
    findings.push({
      id: "hip-imbalance",
      label: "骨盤の左右の傾き",
      severity: hipLevel,
      detail: "左右の骨盤の高さに差があります。体幹の筋力バランスの偏りが一因となることがあります。",
    });
  }

  return { shoulderTilt, hipTilt, findings };
}

export function runDiagnosis(landmarks: {
  front: LandmarkSet;
  side: LandmarkSet;
  back: LandmarkSet;
}): DiagnosisResult {
  const skeletal = classifySkeletal(landmarks.front);
  const sideFindings = analyzeSidePosture(landmarks.side);
  const back = analyzeBackBalance(landmarks.back);

  return {
    skeletalType: skeletal.type,
    skeletalScores: skeletal.scores,
    measurements: {
      shoulderHipRatio: skeletal.shoulderHipRatio,
      torsoLegRatio: skeletal.torsoLegRatio,
      shoulderTilt: back.shoulderTilt,
      hipTilt: back.hipTilt,
    },
    postureFindings: [...sideFindings, ...back.findings],
  };
}
