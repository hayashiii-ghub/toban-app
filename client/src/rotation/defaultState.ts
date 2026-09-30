import type { AppState } from "./types";

/** 当番表を持たない画面（404・共有ページのエラー）と、初回の見本が使う見た目 */
export const DEFAULT_THEME_ID = "sarasara/chalkboard";

/**
 * ローカルストレージが空のときに使うデフォルト状態。そのまま書き換えて使える見本の当番表で、
 * 使い方の説明は初回ツアー（OnboardingOverlay）が受け持つ。LP の見本（HeroRosterMock）と同じ中身。
 * 2026-09 まで入れていた「はじめてガイド」は guide-localization.ts が見分け続ける。
 * 「現在の状態をデフォルトに設定」でコピーしたJSONをここに反映すると、
 * 次回からの初回表示がその状態になります。
 */
export const DEFAULT_APP_STATE: AppState = {
  schedules: [
    {
      id: "s_default_1",
      name: "掃除当番（見本）",
      rotation: 0,
      assignmentMode: "task",
      designThemeId: DEFAULT_THEME_ID,
      fontId: "standard",
      groups: [
        { id: "g1", tasks: ["床そうじ"], emoji: "🧹" },
        { id: "g2", tasks: ["ゴミ出し"], emoji: "🗑️" },
        { id: "g3", tasks: ["給湯室"], emoji: "🍵" },
        { id: "g4", tasks: ["窓ふき"], emoji: "🪟" },
      ],
      members: [
        {
          id: "m1",
          name: "佐藤",
          color: "#3B82F6",
          bgColor: "#DBEAFE",
          textColor: "#1E3A5F",
        },
        {
          id: "m2",
          name: "鈴木",
          color: "#10B981",
          bgColor: "#D1FAE5",
          textColor: "#064E3B",
        },
        {
          id: "m3",
          name: "高橋",
          color: "#F97316",
          bgColor: "#FED7AA",
          textColor: "#7C2D12",
        },
        {
          id: "m4",
          name: "田中",
          color: "#8B5CF6",
          bgColor: "#EDE9FE",
          textColor: "#4C1D95",
        },
      ],
    },
  ],
  activeScheduleId: "s_default_1",
};

/**
 * 英語ロケールでの初回表示用デフォルト。
 * 英語ユーザがクリーンな状態で開いたとき、日本語の見本ではなく英語の見本を seed する。
 */
export const DEFAULT_APP_STATE_EN: AppState = {
  schedules: [
    {
      id: "s_default_1",
      name: "Cleaning duty (sample)",
      rotation: 0,
      assignmentMode: "task",
      designThemeId: DEFAULT_THEME_ID,
      fontId: "standard",
      groups: [
        { id: "g1", tasks: ["Floors"], emoji: "🧹" },
        { id: "g2", tasks: ["Trash"], emoji: "🗑️" },
        { id: "g3", tasks: ["Kitchen"], emoji: "🍵" },
        { id: "g4", tasks: ["Windows"], emoji: "🪟" },
      ],
      members: [
        {
          id: "m1",
          name: "Alex",
          color: "#3B82F6",
          bgColor: "#DBEAFE",
          textColor: "#1E3A5F",
        },
        {
          id: "m2",
          name: "Sam",
          color: "#10B981",
          bgColor: "#D1FAE5",
          textColor: "#064E3B",
        },
        {
          id: "m3",
          name: "Kim",
          color: "#F97316",
          bgColor: "#FED7AA",
          textColor: "#7C2D12",
        },
        {
          id: "m4",
          name: "Lee",
          color: "#8B5CF6",
          bgColor: "#EDE9FE",
          textColor: "#4C1D95",
        },
      ],
    },
  ],
  activeScheduleId: "s_default_1",
};
