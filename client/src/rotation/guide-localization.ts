import type { Locale } from "@/i18n/core";
import type { AppState, Schedule } from "./types";
import { DEFAULT_APP_STATE, DEFAULT_APP_STATE_EN } from "./defaultState";

const GUIDE_JA = DEFAULT_APP_STATE.schedules[0];
const GUIDE_EN = DEFAULT_APP_STATE_EN.schedules[0];

// 2026-09 まで初回に入れていた「はじめてガイド」。手元に残っている人がいるので見分け続ける。
// 見分けるのは id・名前・仕事・メンバー名なので、色は今の見本のものを借りる。
const LEGACY_EMOJIS = ["📋", "✏️", "🔄", "🖨️"];

function legacyGuide(
  base: Schedule,
  name: string,
  tasks: string[][],
  memberNames: string[]
): Schedule {
  return {
    ...base,
    name,
    groups: base.groups.map((group, index) => ({
      ...group,
      emoji: LEGACY_EMOJIS[index],
      tasks: tasks[index],
    })),
    members: base.members.map((member, index) => ({
      ...member,
      name: memberNames[index],
    })),
  };
}

const GUIDE_V1_JA = legacyGuide(
  GUIDE_JA,
  "はじめてガイド",
  [
    ["テンプレートから選ぶ", "「テンプレート」ボタンから好きな当番表を選ぼう"],
    ["メンバー・タスクを編集", "名前やタスクをタップして自由に変更できるよ"],
    ["ローテーションを回す", "◀ ▶ ボタンで担当者を切り替えよう"],
    ["印刷 or 共有する", "完成したら印刷・PDF保存・URL共有ができるよ"],
  ],
  ["ステップ1", "ステップ2", "ステップ3", "ステップ4"]
);

const GUIDE_V1_EN = legacyGuide(
  GUIDE_EN,
  "Getting started",
  [
    ["Pick a template", "Select + to choose a template or start from scratch"],
    ["Edit members & tasks", "Select Edit to add names and update tasks"],
    ["Advance the rotation", "Use the ◀ ▶ buttons to switch who's on duty"],
    ["Print or share", "Print your schedule, save a PDF, or share a link"],
  ],
  ["Step 1", "Step 2", "Step 3", "Step 4"]
);

// This English copy was seeded before the English UI polish. Recognize the
// complete historical version, rather than guessing from its title alone.
const LEGACY_GUIDE_EN = legacyGuide(
  GUIDE_V1_EN,
  "Getting Started",
  [
    ["Pick a template", "Choose any roster from the Template button"],
    ["Edit members & tasks", "Tap a name or task to change it freely"],
    ["Advance the rotation", "Use the ◀ ▶ buttons to switch who's on duty"],
    ["Print or share", "When you're done, print, save as PDF, or share by URL"],
  ],
  ["Step 1", "Step 2", "Step 3", "Step 4"]
);

/** 旧い見本（テスト用）。今の見本とは別の組として、互いの言語にだけ切り替える */
export const GUIDE_V1 = {
  ja: GUIDE_V1_JA,
  en: GUIDE_V1_EN,
  historicalEn: LEGACY_GUIDE_EN,
};

// 世代ごとの日本語版・英語版の組。旧い見本が今の見本の中身に化けないよう、組の中でだけ切り替える
const GUIDE_VERSIONS = [
  { ja: GUIDE_JA, en: GUIDE_EN, others: [] as Schedule[] },
  { ja: GUIDE_V1_JA, en: GUIDE_V1_EN, others: [LEGACY_GUIDE_EN] },
];

function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function matchesGuide(schedule: Schedule, guide: Schedule): boolean {
  return (
    schedule.id === "s_default_1" &&
    schedule.name === guide.name &&
    schedule.groups.length === guide.groups.length &&
    schedule.members.length === guide.members.length &&
    schedule.groups.every((group, index) => {
      const original = guide.groups[index];
      return (
        group.id === original.id &&
        sameStrings(group.tasks, original.tasks) &&
        sameStrings(group.memberIds ?? [], original.memberIds ?? [])
      );
    }) &&
    schedule.members.every((member, index) => {
      const original = guide.members[index];
      return member.id === original.id && member.name === original.name;
    })
  );
}

function findGuideVersion(schedule: Schedule) {
  return GUIDE_VERSIONS.find(version =>
    [version.ja, version.en, ...version.others].some(guide =>
      matchesGuide(schedule, guide)
    )
  );
}

/** Only the original guide's known, unedited text and structure may be projected. */
export function isOriginalGuide(schedule: Schedule): boolean {
  return findGuideVersion(schedule) !== undefined;
}

/**
 * A display projection, never a storage migration. Keep cloud identity, rotation,
 * appearance and other metadata untouched; customized text is never translated.
 */
export function localizeGuide(schedule: Schedule, locale: Locale): Schedule {
  const version = findGuideVersion(schedule);
  if (!version) return schedule;
  const target = locale === "en" ? version.en : version.ja;
  if (matchesGuide(schedule, target)) return schedule;

  return {
    ...schedule,
    name: target.name,
    groups: schedule.groups.map((group, index) => ({
      ...group,
      tasks: [...target.groups[index].tasks],
    })),
    members: schedule.members.map((member, index) => ({
      ...member,
      name: target.members[index].name,
    })),
  };
}

/** Project only built-in guide text; preserve the state reference when unchanged. */
export function localizeGuideState(state: AppState, locale: Locale): AppState {
  const schedules = state.schedules.map(schedule =>
    localizeGuide(schedule, locale)
  );
  return schedules.every(
    (schedule, index) => schedule === state.schedules[index]
  )
    ? state
    : { ...state, schedules };
}

/**
 * Commands see the displayed language. Selection, rotation and other metadata
 * updates keep the original stored text; a real content edit retains the
 * displayed language as the basis of the now-customized roster.
 */
export function applyLocalizedGuideUpdate(
  state: AppState,
  locale: Locale,
  updater: (visible: AppState) => AppState
): AppState {
  const visible = localizeGuideState(state, locale);
  const next = updater(visible);
  if (next === visible) return state;
  if (visible === state) return next;

  const rawById = new Map(
    state.schedules.map(schedule => [schedule.id, schedule])
  );
  const visibleById = new Map(
    visible.schedules.map(schedule => [schedule.id, schedule])
  );
  let restored = false;
  const schedules = next.schedules.map(schedule => {
    const raw = rawById.get(schedule.id);
    const projected = visibleById.get(schedule.id);
    if (!raw || !projected || raw === projected) return schedule;
    if (schedule === projected) {
      restored = true;
      return raw;
    }
    if (!isOriginalGuide(schedule)) return schedule;

    restored = true;
    return {
      ...schedule,
      name: raw.name,
      groups: schedule.groups.map((group, index) => ({
        ...group,
        tasks: [...raw.groups[index].tasks],
      })),
      members: schedule.members.map((member, index) => ({
        ...member,
        name: raw.members[index].name,
      })),
    };
  });
  return restored ? { ...next, schedules } : next;
}
