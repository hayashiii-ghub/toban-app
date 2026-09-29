export const FONT_IDS = [
  "standard",
  "handwriting",
  "elegant",
  "print",
] as const;

export const APPEARANCE_COLOR_IDS = [
  "print",
  "blackboard",
  "orange",
  "sunflower",
  "hydrangea",
  "cherry_blossom",
  "fresh_green",
  "sky",
  "night_sky",
] as const;

export const APPEARANCE_TEXTURE_IDS = ["smooth", "textured", "soft"] as const;

export type FontId = (typeof FONT_IDS)[number];
export type AppearanceColorId = (typeof APPEARANCE_COLOR_IDS)[number];
export type AppearanceTextureId = (typeof APPEARANCE_TEXTURE_IDS)[number];

export interface ScheduleAppearance {
  font: FontId;
  color: AppearanceColorId;
  texture: AppearanceTextureId;
}

/** メンバーの色。テンプレートと新規メンバーの既定色で共有する */
export const MEMBER_PRESETS = [
  { color: "#EF4444", bgColor: "#FEE2E2", textColor: "#7F1D1D" }, // 赤
  { color: "#F97316", bgColor: "#FED7AA", textColor: "#7C2D12" }, // オレンジ
  { color: "#EAB308", bgColor: "#FEF9C3", textColor: "#713F12" }, // 黄
  { color: "#10B981", bgColor: "#D1FAE5", textColor: "#064E3B" }, // 緑
  { color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" }, // 青
  { color: "#8B5CF6", bgColor: "#EDE9FE", textColor: "#4C1D95" }, // 紫
  { color: "#EC4899", bgColor: "#FCE7F3", textColor: "#831843" }, // ピンク
];
