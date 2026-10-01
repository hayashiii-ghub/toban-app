import { useId, useMemo } from "react";
import type {
  AssignmentMode,
  Member,
  RotationConfig,
  TaskGroup,
} from "@/rotation/types";
import { computeAssignments, listDateTurns } from "@/rotation/utils";
import { formatTaskNames } from "@/rotation/taskFormatting";
import { safeGetItem, safeSetItem } from "@/lib/storage";
import { useDateLocale, useLocale, useT } from "@/i18n";
import { useLocalToday } from "@/hooks/useLocalToday";

// 共有ページごとに、この端末で選んだ自分の名前を覚えておく（その当番表を開いた人だけのもの）
const storageKey = (slug: string) => `toban-shared-me:${slug}`;

export function loadSharedMe(slug: string): string | null {
  return safeGetItem(storageKey(slug)) || null;
}

export function saveSharedMe(slug: string, memberId: string | null) {
  safeSetItem(storageKey(slug), memberId ?? "");
}
// 日付で交代する表で、今の次に出す順番の数
const UPCOMING = 3;

interface MyDutyProps {
  /** 選んだ人。当番表にいない人なら選んでいない扱い */
  meId: string | null;
  groups: TaskGroup[];
  members: Member[];
  rotation: number;
  rotationConfig?: RotationConfig;
  assignmentMode?: AssignmentMode;
  onChange: (memberId: string | null) => void;
}

/** 共有ページで、受け取った人が自分の名前を選ぶと、今と次の当番が分かる */
export function MyDuty({
  meId: chosenId,
  groups,
  members,
  rotation,
  rotationConfig,
  assignmentMode,
  onChange,
}: MyDutyProps) {
  const t = useT();
  const { locale } = useLocale();
  const dateLocale = useDateLocale();
  const today = useLocalToday();
  const id = useId();
  const activeMembers = members.filter(m => !m.skipped);
  const me = activeMembers.find(m => m.id === chosenId);
  const meId = me?.id ?? null;

  const tasksAt = (turn: number) =>
    computeAssignments(groups, members, turn, assignmentMode)
      .filter(a => a.member.id === meId)
      .map(a => a.group);

  const upcoming = useMemo(() => {
    if (!meId) return [];
    const format = (date: Date) =>
      date.toLocaleDateString(dateLocale, {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      });
    if (rotationConfig?.mode === "date") {
      return listDateTurns(
        rotationConfig,
        activeMembers.length,
        today,
        UPCOMING + 1
      )
        .slice(1)
        .map(turn => ({
          label:
            turn.start.getTime() === turn.end.getTime()
              ? format(turn.start)
              : t("turn.period", {
                  start: format(turn.start),
                  end: format(turn.end),
                }),
          groups: tasksAt(turn.rotation),
        }));
    }
    return [{ label: t("shared.me.next"), groups: tasksAt(rotation + 1) }];
    // tasksAt は groups / members / meId から決まる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meId,
    rotationConfig,
    rotation,
    groups,
    members,
    assignmentMode,
    dateLocale,
    today,
    t,
  ]);

  const describe = (list: TaskGroup[], isNow = false) =>
    list.length === 0
      ? t(isNow ? "shared.me.rest" : "shared.me.off")
      : list
          .map(g => `${g.emoji} ${formatTaskNames(g.tasks, locale)}`)
          .join(locale === "en" ? " / " : "　");

  const current = me ? tasksAt(rotation) : [];

  return (
    <section className="px-3 sm:px-4 pb-4 rotation-no-print">
      <div
        className="max-w-4xl mx-auto theme-border theme-shadow-sm theme-surface p-3 sm:p-4"
        style={{ borderRadius: "var(--dt-border-radius)" }}
      >
        <label
          htmlFor={`${id}-me`}
          className="block text-xs font-bold mb-1.5"
          style={{ color: "var(--dt-text-secondary)" }}
        >
          {t("shared.me.choose")}
        </label>
        <select
          id={`${id}-me`}
          value={meId ?? ""}
          onChange={e => onChange(e.target.value || null)}
          className="dt-field w-full sm:w-auto sm:min-w-[14rem] px-3 py-2 text-sm font-bold"
        >
          <option value="">{t("shared.me.placeholder")}</option>
          {activeMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>

        {me && (
          <div className="mt-3" aria-live="polite">
            <h2
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: "var(--dt-text-secondary)" }}
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: me.color }}
              />
              {t("shared.me.title", { name: me.name })}
            </h2>
            <p
              className="mt-1 text-lg sm:text-xl font-extrabold leading-snug"
              style={{ color: "var(--dt-text)" }}
            >
              {describe(current, true)}
            </p>
            {upcoming.length > 0 && (
              <dl className="mt-3 flex flex-col gap-1 text-sm">
                {upcoming.map(item => (
                  <div key={item.label} className="flex gap-3">
                    <dt
                      className="shrink-0 min-w-[7.5rem] font-bold"
                      style={{ color: "var(--dt-text-muted)" }}
                    >
                      {item.label}
                    </dt>
                    <dd style={{ color: "var(--dt-text-secondary)" }}>
                      {describe(item.groups)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
