import type {
  Member,
  RotationConfig,
  ScheduleTemplate,
  TaskGroup,
} from "./types";
import { MEMBER_PRESETS } from "./constants";
import { addDays, formatIsoDateLocal, startOfLocalDay } from "./dateUtils";
import { generateId } from "./utils";
import { LIMITS } from "@shared/limits";

/** 1 行に 1 人。カンマ・読点・タブで区切っても良い（表計算や LINE から貼り付けた名前を想定） */
export function parseNames(text: string): string[] {
  return text.split(/[\n,、\t]+/).flatMap(part => {
    const name = part.trim().slice(0, LIMITS.memberName);
    return name ? [name] : [];
  });
}

/**
 * テンプレートの見本の名前を、入れた名前に置き換える。仕事（グループ）は変えない。
 * 人数が変わるときは、残る人の ID を保ったまま足し引きし、担当者を絞った仕事の
 * 割り当て（memberIds）も合わせる。名前が空ならテンプレートのまま返す。
 */
export function applyMemberNames(
  template: ScheduleTemplate,
  names: string[]
): Pick<ScheduleTemplate, "members" | "groups"> {
  if (names.length === 0)
    return { members: template.members, groups: template.groups };

  const old = template.members;
  // 足す人には、まだ使っていない色から順に付ける（見本の色と重ならないように）
  const usedColors = new Set(old.slice(0, names.length).map(m => m.color));
  const freshPresets = MEMBER_PRESETS.filter(p => !usedColors.has(p.color));
  const members: Member[] = names.map((name, i) =>
    i < old.length
      ? { ...old[i], name }
      : {
          id: generateId("m"),
          name,
          ...(freshPresets[i - old.length] ??
            MEMBER_PRESETS[i % MEMBER_PRESETS.length]),
        }
  );
  const removed = new Set(old.slice(names.length).map(m => m.id));
  const added = members.slice(old.length).map(m => m.id);
  const allOld = old.map(m => m.id);

  const groups: TaskGroup[] = template.groups.map(group => {
    if (!group.memberIds) return group;
    // 見本の全員が担当の仕事は、足した人も担当にする。一部の人だけの仕事はそのまま
    const coversEveryone = allOld.every(id => group.memberIds!.includes(id));
    const memberIds = [
      ...group.memberIds.filter(id => !removed.has(id)),
      ...(coversEveryone ? added : []),
    ];
    if (memberIds.length > 0) return { ...group, memberIds };
    const { memberIds: _unused, ...rest } = group;
    return rest;
  });
  return { members, groups };
}

export type RotationPreset = "manual" | "weekly" | "weekdays";

/** 今週の月曜日 */
function mondayOfWeek(today: Date): Date {
  const day = startOfLocalDay(today);
  return addDays(day, -((day.getDay() + 6) % 7));
}

/** 今日が土日なら次の月曜、平日なら今日 */
function nextWeekday(today: Date): Date {
  const day = startOfLocalDay(today);
  const dow = day.getDay();
  return dow === 6 ? addDays(day, 2) : dow === 0 ? addDays(day, 1) : day;
}

/**
 * 作るときに選べる交代のしかた。あとから編集画面の「交代のしかた」で細かく変えられる
 * - weekly: 毎週月曜に交代（今週の月曜から数えるので、今週が最初の順番）
 * - weekdays: 平日ごとに交代（土日祝は休み。今日（土日なら次の月曜）が最初の順番）
 */
export function rotationConfigForPreset(
  preset: RotationPreset,
  today: Date
): RotationConfig | undefined {
  if (preset === "manual") return undefined;
  return preset === "weekly"
    ? {
        mode: "date",
        startDate: formatIsoDateLocal(mondayOfWeek(today)),
        cycleDays: 7,
      }
    : {
        mode: "date",
        startDate: formatIsoDateLocal(nextWeekday(today)),
        cycleDays: 1,
        skipSaturday: true,
        skipSunday: true,
        skipHolidays: true,
      };
}
