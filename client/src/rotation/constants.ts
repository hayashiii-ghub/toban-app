export { TEMPLATES } from "@shared/templates";

export const APP_TITLE = "toban｜無料で当番表を簡単作成・印刷・共有";

export const ANIMATION_DURATION_MS = 500;
export const CARD_STAGGER_DELAY = 0.08;
export const TASK_STAGGER_DELAY = 0.06;

export const STORAGE_KEY = "rotation-schedule-app-state";
export const ONBOARDING_STORAGE_KEY = "toban-onboarding-complete";

export { MEMBER_PRESETS } from "@shared/appearance";

/** カスタムカラーから bgColor/textColor を自動生成 */
export function colorPresetFromHex(hex: string): {
  color: string;
  bgColor: string;
  textColor: string;
} {
  // hex → RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // bgColor: 元色を白と90%ブレンド
  const bg = (c: number) =>
    Math.round(c + (255 - c) * 0.85)
      .toString(16)
      .padStart(2, "0");
  const bgColor = `#${bg(r)}${bg(g)}${bg(b)}`;
  // textColor: 元色を暗くする
  const dk = (c: number) =>
    Math.round(c * 0.3)
      .toString(16)
      .padStart(2, "0");
  const textColor = `#${dk(r)}${dk(g)}${dk(b)}`;
  return { color: hex, bgColor, textColor };
}
