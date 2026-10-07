import type {
  Assignment,
  AssignmentMode,
  Member,
  RotationConfig,
  TaskGroup,
} from "./types";
import { countSkipDays, isSkippedDate } from "./holidays";
import {
  addDays,
  diffLocalCalendarDays,
  parseIsoDateLocal,
  startOfLocalDay,
} from "./dateUtils";

// 誰がいつ何の当番かの計算。サーバー（カレンダーの配信）からも読むので、
// ブラウザに依存するもの（localStorage・フォントの設定など）を import しない

export function computeAssignments(
  groups: TaskGroup[],
  members: Member[],
  rotation: number,
  assignmentMode?: AssignmentMode
): Assignment[] {
  const activeMembers = members.filter(m => !m.skipped);
  if (activeMembers.length === 0) return [];
  const isTaskMode = assignmentMode === "task";
  return groups.map((group, i) => {
    // グループ専用メンバーが指定されている場合、そのプールを使う
    let pool = activeMembers;
    let useGroupIndex = true;
    if (group.memberIds && group.memberIds.length > 0) {
      const groupMembers = group.memberIds
        .map(id => activeMembers.find(m => m.id === id))
        .filter((m): m is Member => m !== undefined);
      if (groupMembers.length > 0) {
        pool = groupMembers;
        // タスクモード: 常にグループインデックスを使う（同じプールでも別タスクに別メンバー）
        // 担当者モード: 専用プールではグループインデックスオフセット不要
        useGroupIndex = isTaskMode ? true : false;
      }
    }
    const offset = useGroupIndex ? i + rotation : rotation;
    const memberIdx = ((offset % pool.length) + pool.length) % pool.length;
    return { group, member: pool[memberIdx] };
  });
}

export function computeDateRotation(
  config: RotationConfig,
  memberCount: number
): number {
  return computeDateRotationForDate(config, memberCount, new Date());
}

export function computeDateRotationForDate(
  config: RotationConfig,
  memberCount: number,
  targetDate: Date
): number {
  if (
    !config.startDate ||
    !config.cycleDays ||
    config.cycleDays <= 0 ||
    memberCount <= 0
  ) {
    return 0;
  }

  const start = parseIsoDateLocal(config.startDate);
  if (!start) return 0;

  let effectiveTarget = startOfLocalDay(targetDate);
  while (
    diffLocalCalendarDays(start, effectiveTarget) >= 0 &&
    isSkippedDate(effectiveTarget, config)
  ) {
    effectiveTarget = addDays(effectiveTarget, -1);
  }

  const diffDays = diffLocalCalendarDays(start, effectiveTarget);
  if (diffDays < 0) return 0;
  const skipDays = countSkipDays(start, effectiveTarget, config);
  const effectiveDays = diffDays - skipDays;
  const cycles = Math.floor(effectiveDays / config.cycleDays);
  return ((cycles % memberCount) + memberCount) % memberCount;
}

export interface DateTurn {
  /** その期間の順番。computeDateRotationForDate と同じ値 */
  rotation: number;
  /** 期間の初日 */
  start: Date;
  /** 期間の最終日（休みの日は含めない） */
  end: Date;
}

// 開始日が遠い過去でも止まるための上限（約 30 年）
const MAX_TURN_SCAN_DAYS = 11000;

/**
 * 日付モードで、今日を含む期間から先の期間を count 個（既定は人数分）返す。先頭が今の期間。
 * 今日が休みの日なら、その直前の期間を今の期間とする（computeDateRotationForDate と同じ）。
 * 開始日より前なら、開始日からの期間を返す。
 */
export function listDateTurns(
  config: RotationConfig,
  memberCount: number,
  today: Date,
  count = memberCount
): DateTurn[] {
  const cycleDays = config.cycleDays;
  if (!config.startDate || !cycleDays || cycleDays <= 0 || memberCount <= 0) {
    return [];
  }
  const start = parseIsoDateLocal(config.startDate);
  if (!start) return [];
  const target = startOfLocalDay(today);

  const turns: DateTurn[] = [];
  let period: DateTurn | null = null;
  // 開始日から数えた、休みでない日の数（その日を含まない）
  let effectiveDays = 0;
  for (
    let day = start, scanned = 0;
    turns.length < count && scanned < MAX_TURN_SCAN_DAYS;
    day = addDays(day, 1), scanned++
  ) {
    if (isSkippedDate(day, config)) continue;
    if (effectiveDays % cycleDays === 0) {
      // 次の期間が今日より後に始まるなら、閉じる期間が今の期間
      if (period && (turns.length > 0 || day > target)) turns.push(period);
      period = {
        rotation: Math.floor(effectiveDays / cycleDays) % memberCount,
        start: day,
        end: day,
      };
    } else if (period) {
      period.end = day;
    }
    effectiveDays++;
  }
  return turns;
}
