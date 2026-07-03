export type PhotoAngle = "front" | "side" | "back";

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: "正面",
  side: "側面",
  back: "背面",
};

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type LandmarkSet = Landmark[];

export type PhotoSlots = Partial<Record<PhotoAngle, string>>;

export type SkeletalType = "straight" | "wave" | "natural";

export const SKELETAL_TYPE_LABELS: Record<SkeletalType, string> = {
  straight: "ストレートタイプ",
  wave: "ウェーブタイプ",
  natural: "ナチュラルタイプ",
};

export interface PostureFinding {
  id: string;
  label: string;
  severity: "low" | "mid" | "high";
  detail: string;
}

export interface DiagnosisResult {
  skeletalType: SkeletalType;
  skeletalScores: Record<SkeletalType, number>;
  measurements?: {
    shoulderHipRatio: number;
    torsoLegRatio: number;
    shoulderTilt: number;
    hipTilt: number;
  };
  postureFindings: PostureFinding[];
  postureChecked: boolean;
}

export type CheckPart = "collarbone" | "wrist" | "knee" | "ear";

export const CHECK_PART_LABELS: Record<CheckPart, string> = {
  collarbone: "鎖骨",
  wrist: "手首",
  knee: "膝",
  ear: "耳",
};
