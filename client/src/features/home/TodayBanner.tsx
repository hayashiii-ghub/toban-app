import type { TaskGroup, Member, AssignmentMode } from "@/rotation/types";
import { computeAssignments } from "@/rotation/utils";
import { useT, useDateLocale } from "@/i18n";

interface TodayBannerProps {
  groups: TaskGroup[];
  members: Member[];
  rotation: number;
  assignmentMode?: AssignmentMode;
}

export function TodayBanner({ groups, members, rotation, assignmentMode }: TodayBannerProps) {
  const t = useT();
  const dateLocale = useDateLocale();
  const assignments = computeAssignments(groups, members, rotation, assignmentMode);
  if (assignments.length === 0) return null;

  const today = new Date().toLocaleDateString(dateLocale, { month: "short", day: "numeric", weekday: "short" });

  return (
    <div className="px-3 sm:px-4 pb-2 rotation-no-print">
      <div
        className="max-w-4xl mx-auto theme-border theme-shadow-sm px-3 py-2 flex items-center gap-2 flex-wrap"
        style={{ backgroundColor: "var(--dt-card-bg)", borderRadius: "var(--dt-border-radius-sm)" }}
      >
        <span className="text-xs font-bold shrink-0" style={{ color: "var(--dt-text-muted)" }}>
          {t("today.label", { date: today })}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {assignments.map(({ group, member }) => (
            <span
              key={group.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: member.bgColor, color: member.textColor }}
            >
              <span>{group.emoji}</span>
              <span>{member.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
