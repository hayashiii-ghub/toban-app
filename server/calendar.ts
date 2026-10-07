import type {
  AssignmentMode,
  Member,
  RotationConfig,
  TaskGroup,
} from "../shared/types";
// 当番の計算は画面と同じものを使う（ブラウザに依存しない部分だけを分けてある）
import {
  computeAssignments,
  listDateTurns,
} from "../client/src/rotation/turns";
import { addDays, formatIsoDateLocal } from "../client/src/rotation/dateUtils";

export type CalendarLang = "ja" | "en";

export interface CalendarSchedule {
  slug: string;
  name: string;
  groups: TaskGroup[];
  members: Member[];
  rotationConfig?: RotationConfig;
  assignmentMode?: AssignmentMode;
}

// 入れる期間。読み直すたびに今日を起点にずれていく
const PAST_DAYS = 31;
const FUTURE_DAYS = 183;
// カレンダーに読み直してほしい間隔（従うかはカレンダーしだい。Google は数時間〜1 日おき）
const REFRESH = "PT6H";

const TEXT = {
  ja: {
    everyone: "全員",
    calName: (schedule: string, who: string) => `${schedule}（${who}）`,
    title: (schedule: string, detail: string) => `${schedule}：${detail}`,
    tasks: (tasks: string[]) => tasks.join("・"),
    groups: (list: string[]) => list.join("、"),
    person: (name: string, tasks: string) => `${name}（${tasks}）`,
    people: (list: string[]) => list.join("、"),
  },
  en: {
    everyone: "everyone",
    calName: (schedule: string, who: string) => `${schedule} (${who})`,
    title: (schedule: string, detail: string) => `${schedule}: ${detail}`,
    tasks: (tasks: string[]) => tasks.join(", "),
    groups: (list: string[]) => list.join(" / "),
    person: (name: string, tasks: string) => `${name} (${tasks})`,
    people: (list: string[]) => list.join(", "),
  },
} as const;

/** 日付で交代する表で、member を渡せばその人の当番だけ、省けば全員の当番を iCalendar にする */
export function buildCalendar(
  schedule: CalendarSchedule,
  options: {
    memberId?: string;
    lang: CalendarLang;
    origin: string;
    now?: Date;
  }
): string {
  const { rotationConfig, groups, members, assignmentMode } = schedule;
  const text = TEXT[options.lang];
  const now = options.now ?? new Date();
  const member = options.memberId
    ? members.find(m => m.id === options.memberId)
    : undefined;
  const activeCount = members.filter(m => !m.skipped).length;
  const url = `${options.origin}/s/${schedule.slug}`;

  const windowStart = addDays(now, -PAST_DAYS);
  const windowEnd = addDays(now, FUTURE_DAYS);
  const cycleDays = rotationConfig?.cycleDays ?? 1;
  const turns =
    rotationConfig?.mode === "date"
      ? listDateTurns(
          rotationConfig,
          activeCount,
          windowStart,
          Math.ceil((PAST_DAYS + FUTURE_DAYS) / cycleDays) + 2
        ).filter(turn => turn.start <= windowEnd)
      : [];

  const events: string[][] = [];
  for (const turn of turns) {
    const assignments = computeAssignments(
      groups,
      members,
      turn.rotation,
      assignmentMode
    );
    let detail: string;
    if (member) {
      const mine = assignments.filter(a => a.member.id === member.id);
      if (mine.length === 0) continue;
      detail = text.groups(mine.map(a => text.tasks(a.group.tasks)));
    } else {
      if (assignments.length === 0) continue;
      // 同じ人が複数の仕事を持つ回は、その人の仕事をまとめて 1 回だけ書く
      const byMember = new Map<string, { name: string; tasks: string[] }>();
      for (const a of assignments) {
        const entry = byMember.get(a.member.id) ?? {
          name: a.member.name,
          tasks: [],
        };
        entry.tasks.push(text.tasks(a.group.tasks));
        byMember.set(a.member.id, entry);
      }
      detail = text.people(
        [...byMember.values()].map(e =>
          text.person(e.name, text.groups(e.tasks))
        )
      );
    }
    const start = toIcsDate(turn.start);
    events.push([
      "BEGIN:VEVENT",
      `UID:${schedule.slug}-${member?.id ?? "all"}-${start}@toban.app`,
      `DTSTAMP:${toIcsTimestamp(now)}`,
      `DTSTART;VALUE=DATE:${start}`,
      // 終日の予定の終わりは、最終日の翌日を書く決まり
      `DTEND;VALUE=DATE:${toIcsDate(addDays(turn.end, 1))}`,
      `SUMMARY:${escapeText(text.title(schedule.name, detail))}`,
      `URL:${url}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ]);
  }

  const calName = text.calName(schedule.name, member?.name ?? text.everyone);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//toban.app//toban//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    `NAME:${escapeText(calName)}`,
    `REFRESH-INTERVAL;VALUE=DURATION:${REFRESH}`,
    `X-PUBLISHED-TTL:${REFRESH}`,
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function toIcsDate(date: Date): string {
  return formatIsoDateLocal(date).replaceAll("-", "");
}

function toIcsTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** RFC 5545 の TEXT。\ ; , と改行を逃がす */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/** 1 行は 75 バイトまで。超えたら折り返し、続きの行の頭に空白を置く（文字の途中では切らない） */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // 続きの行は頭の空白 1 バイトの分だけ短くする
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}
