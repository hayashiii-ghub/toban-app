import type { AssignmentMode, Member, TaskGroup } from "@/rotation/types";
import { computeAssignments } from "@/rotation/utils";
import { sectorAngles, sectorMidpoint, sectorPath } from "@/rotation/discGeometry";
import { useT } from "@/i18n";

interface RotationDiscProps {
  groups: TaskGroup[];
  members: Member[];
  /** ポインタ位置（= effectiveRotation）。現在の周回を盤面に焼き込む。 */
  rotation: number;
  assignmentMode?: AssignmentMode;
}

// viewBox 座標（正方・mm 換算は印刷CSS側でスケール）。
const SIZE = 360;
const C = SIZE / 2;
const R_CUT = 174; // 外周カット線
const ROLE_OUTER = 170;
const ROLE_INNER = 108; // = メンバーリング外周（ここがカット線：内側ディスクを切り離して回す）
const MEMBER_INNER = 46;
const HUB = MEMBER_INNER;
const ROLE_LABEL_R = (ROLE_OUTER + ROLE_INNER) / 2;
const MEMBER_LABEL_R = (ROLE_INNER + MEMBER_INNER) / 2;

export function RotationDisc({ groups, members, rotation, assignmentMode }: RotationDiscProps) {
  const t = useT();
  const pool = members.filter(m => !m.skipped);

  // 単一回転ディスクで忠実に表現できる構成かを判定する。
  // - group 専用プール（memberIds）があると1枚の盤に乗らない
  // - 役割数 > メンバー数だと1人が複数役割を持ち、1セクター=1役割で表せない
  const hasGroupPool = groups.some(g => g.memberIds && g.memberIds.length > 0);
  const representable =
    groups.length > 0 && pool.length > 0 && !hasGroupPool && groups.length <= pool.length;

  if (!representable) {
    return (
      <div className="px-3 sm:px-4 py-3 sm:py-4 rotation-print-disc-section">
        <div className="max-w-2xl mx-auto theme-border theme-shadow-sm p-4 text-center"
          style={{ backgroundColor: "var(--dt-card-bg)", borderRadius: "var(--dt-border-radius)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--dt-text-secondary)" }}>
            {t("disc.unsupported")}
          </p>
        </div>
      </div>
    );
  }

  // アプリ全体（cards/table/calendar）と同じ computeAssignments から
  // メンバー→役割の対応を作り、盤面の整合性を保証する。
  const assignments = computeAssignments(groups, members, rotation, assignmentMode);
  const roleByMemberId = new Map<string, TaskGroup>(assignments.map(a => [a.member.id, a.group]));
  const n = pool.length;
  const hasOffDuty = pool.length > groups.length;

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4 rotation-print-disc-section">
      <div className="max-w-2xl mx-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-auto rotation-print-disc-svg"
          role="img"
          aria-label={t("view.disc")}
          style={{ maxWidth: "min(100%, 520px)", margin: "0 auto", display: "block" }}
        >
          {/* 外周カット線 */}
          <circle cx={C} cy={C} r={R_CUT} fill="none"
            stroke="var(--dt-border-color, #333)" strokeWidth={1} strokeDasharray="4 3" />

          {pool.map((member, i) => {
            const { startDeg, endDeg } = sectorAngles(n, i);
            const role = roleByMemberId.get(member.id);
            const rolePath = sectorPath(C, C, ROLE_INNER, ROLE_OUTER, startDeg, endDeg);
            const memberPath = sectorPath(C, C, MEMBER_INNER, ROLE_INNER, startDeg, endDeg);
            const roleLabelPos = sectorMidpoint(C, C, ROLE_LABEL_R, startDeg, endDeg);
            const memberLabelPos = sectorMidpoint(C, C, MEMBER_LABEL_R, startDeg, endDeg);

            const roleText = role ? `${role.emoji} ${role.tasks.join("・")}` : `💤 ${t("disc.offDuty")}`;

            return (
              <g key={member.id}>
                {/* hover ツールチップ / a11y。盤面は絵文字のみなので、ここで役割：メンバーを補う。 */}
                <title>{`${roleText}：${member.name}`}</title>
                {/* 役割リング（外・固定側）。役割名テキストは横書きだと盤からはみ出すため、
                    盤面には絵文字のみ置き、フルテキストは下の凡例で担保する。 */}
                <path d={rolePath} fill="var(--dt-card-bg, #fff)"
                  stroke="var(--dt-border-color, #333)" strokeWidth={1} />
                <text x={roleLabelPos.x} y={roleLabelPos.y} fontSize={18}
                  textAnchor="middle" dominantBaseline="central">
                  {role ? role.emoji : "💤"}
                </text>

                {/* メンバーリング（内・回す側） */}
                <path d={memberPath} fill={member.bgColor}
                  stroke="var(--dt-border-color, #333)" strokeWidth={1} />
                <text x={memberLabelPos.x} y={memberLabelPos.y} fontSize={13} fontWeight={800}
                  textAnchor="middle" dominantBaseline="central" fill={member.textColor}>
                  {member.name}
                </text>
              </g>
            );
          })}

          {/* 中心ハブ＋ピン穴 */}
          <circle cx={C} cy={C} r={HUB} fill="var(--dt-card-bg, #fff)"
            stroke="var(--dt-border-color, #333)" strokeWidth={1} />
          <circle cx={C} cy={C} r={3.5} fill="none"
            stroke="var(--dt-border-color, #333)" strokeWidth={1} />
        </svg>

        {/* 凡例：盤面の絵文字に対応する役割名フルテキスト（印刷でも残す）。
            役割に色は無いため、アプリのチップ語彙（TodayBanner のピル）に形だけ揃える。 */}
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5 list-none p-0">
          {groups.map(group => (
            <li key={group.id}
              className="theme-border inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "var(--dt-card-bg)", color: "var(--dt-text-secondary)" }}>
              <span aria-hidden="true">{group.emoji}</span>
              <span>{group.tasks.join("・")}</span>
            </li>
          ))}
          {hasOffDuty && (
            <li
              className="theme-border inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "var(--dt-card-bg)", color: "var(--dt-text-muted)" }}>
              <span aria-hidden="true">💤</span>
              <span>{t("disc.offDuty")}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
