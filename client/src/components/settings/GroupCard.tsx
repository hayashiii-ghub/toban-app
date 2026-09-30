import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import type { Member, TaskGroup } from "@/rotation/types";
import { ColorPalette } from "./ColorPalette";
import { useGroupCardContext } from "./GroupCardContext";
import { LIMITS } from "@shared/limits";
import { useT } from "@/i18n";

interface Props {
  group: TaskGroup;
  gIdx: number;
  groupCount: number;
  ownerMember: Member | undefined;
  isGroupDropTarget: boolean;
}

export function GroupCard({
  group,
  gIdx,
  groupCount,
  ownerMember,
  isGroupDropTarget,
}: Props) {
  const ctx = useGroupCardContext();
  const t = useT();
  const detailsOpen = ctx.openDetailsKey === `details-${gIdx}`;

  return (
    <div
      className={`theme-border transition-all duration-150 ${
        isGroupDropTarget ? "ring-2 ring-amber-400" : ""
      }`}
      style={{
        borderRadius: "var(--dt-border-radius)",
        backgroundColor:
          "color-mix(in srgb, var(--dt-text) 3%, var(--dt-card-bg))",
      }}
      data-drag-item
      data-drop-group={gIdx}
    >
      {/* グループヘッダー */}
      <div
        className="flex items-center gap-2 px-3 sm:px-4 py-2"
        style={{
          backgroundColor: ownerMember
            ? `${ownerMember.color}15`
            : "transparent",
          borderBottom: "1px solid var(--dt-table-border-light)",
        }}
      >
        <div className="flex flex-col shrink-0 sm:hidden">
          <button
            type="button"
            onClick={() => ctx.onMoveGroup(gIdx, -1)}
            disabled={gIdx === 0}
            className="p-0.5 disabled:opacity-20"
            style={{ color: "var(--dt-text-muted)" }}
            aria-label={t("group.moveGroupUp")}
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => ctx.onMoveGroup(gIdx, 1)}
            disabled={gIdx === groupCount - 1}
            className="p-0.5 disabled:opacity-20"
            style={{ color: "var(--dt-text-muted)" }}
            aria-label={t("group.moveGroupDown")}
          >
            <ArrowDown className="size-3.5" />
          </button>
        </div>
        <DragGrip {...ctx.dragHandle({ kind: "group", gIdx })} />
        {/* 絵文字（と担当者の色）を押すと、その下に変える欄が開く */}
        <button
          type="button"
          onClick={() => ctx.onToggleDetails(`details-${gIdx}`)}
          aria-expanded={detailsOpen}
          aria-label={
            ctx.isTaskMode
              ? t("group.emojiOf", { n: gIdx + 1 })
              : t("group.emojiAndColorOf", { n: gIdx + 1 })
          }
          className="relative shrink-0 flex items-center gap-0.5 rounded-lg pl-1 pr-0.5 py-0.5 transition-colors hover:bg-black/5"
        >
          <span className="text-lg leading-none select-none" aria-hidden="true">
            {group.emoji}
          </span>
          {!ctx.isTaskMode && ownerMember && (
            <span
              aria-hidden="true"
              className="absolute left-4 bottom-0 size-2.5 rounded-full border border-white"
              style={{ backgroundColor: ownerMember.color }}
            />
          )}
          <ChevronDown
            className="size-3 transition-transform"
            style={{
              color: "var(--dt-text-muted)",
              transform: detailsOpen ? "rotate(180deg)" : undefined,
            }}
            aria-hidden="true"
          />
        </button>

        {ctx.isTaskMode ? (
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={group.tasks[0] ?? ""}
              onChange={e => ctx.onUpdateTask(gIdx, 0, e.target.value)}
              maxLength={LIMITS.task}
              placeholder={t("group.taskNamePlaceholder")}
              className="w-full theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
              style={{
                borderRadius: "var(--dt-border-radius-sm)",
                backgroundColor: "var(--dt-button-bg)",
              }}
              aria-label={t("group.taskNameOf", { n: gIdx + 1 })}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {!ownerMember && (
              <span
                className="text-xs font-bold"
                style={{ color: "var(--dt-text-muted)" }}
              >
                {t("group.noOwner")}
              </span>
            )}
            {ownerMember && (
              <>
                <input
                  type="text"
                  value={ownerMember.name}
                  onChange={e =>
                    ctx.onMemberNameChange(ownerMember.id, e.target.value)
                  }
                  maxLength={LIMITS.memberName}
                  placeholder={t("group.namePlaceholder")}
                  className="flex-1 min-w-0 theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
                  style={{
                    borderRadius: "var(--dt-border-radius-sm)",
                    backgroundColor: "var(--dt-button-bg)",
                  }}
                  aria-label={t("group.memberNameOf", { n: gIdx + 1 })}
                />
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => ctx.onRemoveGroup(gIdx)}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 shrink-0"
          style={{ color: "#DC2626" }}
          disabled={groupCount <= 1}
          aria-label={t("group.deleteGroup", { n: gIdx + 1 })}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* 詳細設定（絵文字・色変更） */}
      {detailsOpen && (
        <div
          className="px-3 sm:px-4 py-2 flex flex-col gap-2"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--dt-text) 5%, var(--dt-card-bg))",
            borderBottom: "1px solid var(--dt-table-border-light)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold shrink-0"
              style={{ color: "var(--dt-text-muted)" }}
            >
              {t("group.emoji")}
            </span>
            <input
              type="text"
              value={group.emoji}
              onChange={e => ctx.onUpdateEmoji(gIdx, e.target.value)}
              maxLength={LIMITS.emoji}
              className="w-12 text-center text-lg theme-border px-1 py-0.5"
              style={{
                borderRadius: "6px",
                backgroundColor: "var(--dt-button-bg)",
              }}
              aria-label={t("group.changeEmoji", { n: gIdx + 1 })}
            />
          </div>
          {!ctx.isTaskMode && ownerMember && (
            <div>
              <div
                className="text-xs font-bold block mb-1"
                style={{ color: "var(--dt-text-muted)" }}
              >
                {t("group.color")}
              </div>
              <ColorPalette
                member={ownerMember}
                onPresetSelect={ctx.onColorPreset}
                onCustomColor={ctx.onColorCustom}
              />
            </div>
          )}
        </div>
      )}

      {/* タスク一覧 / メンバー一覧 */}
      <div
        className="flex flex-col gap-2 px-3 sm:px-4 pb-3 sm:pb-4 pt-2"
        // 仕事の行を、ほかの仕事の余白に落とすと、その仕事の最後に入る
        data-drop-zone={ctx.isTaskMode ? undefined : gIdx}
      >
        {ctx.isTaskMode ? (
          <TaskModeMembers group={group} gIdx={gIdx} />
        ) : (
          <AssigneeModeTaskList group={group} gIdx={gIdx} />
        )}
      </div>
    </div>
  );
}

// --- タスクモード: メンバー行 ---

function TaskModeMembers({ group, gIdx }: { group: TaskGroup; gIdx: number }) {
  const ctx = useGroupCardContext();
  const t = useT();

  const isImplicitAll = !group.memberIds;
  const groupMemberIds = group.memberIds ?? ctx.activeMemberIds;
  const groupMembers = groupMemberIds
    .map(id => ctx.membersById.get(id))
    .filter((m): m is Member => !!m);
  const unassignedMembers = ctx.activeMembers.filter(
    member => !groupMemberIds.includes(member.id)
  );

  return (
    <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
      {isImplicitAll && ctx.activeMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#D1FAE5", color: "#064E3B" }}
          >
            {t("group.everyone")}
          </span>
          <button
            type="button"
            onClick={() => ctx.onSetExplicitMembers(gIdx)}
            className="text-xs font-bold hover:underline"
            style={{ color: "var(--dt-text-muted)" }}
          >
            {t("group.chooseMembers")}
          </button>
        </div>
      )}
      {!isImplicitAll &&
        groupMembers.map((member, mIdx) => {
          const drop =
            ctx.dropMemberTarget?.gIdx === gIdx &&
            ctx.dropMemberTarget.idx === mIdx
              ? ctx.dropMemberTarget
              : null;
          const colorKey = `task-${gIdx}-${member.id}`;
          return (
            <div key={member.id}>
              <div
                className="relative flex items-center gap-2 transition-all duration-150"
                data-drag-item
                data-drop-member={`${gIdx}:${mIdx}`}
              >
                {drop && <DropLine after={drop.after} />}
                <div className="flex flex-col shrink-0 sm:hidden">
                  <button
                    type="button"
                    onClick={() => ctx.onReorderMember(gIdx, mIdx, -1)}
                    disabled={mIdx === 0}
                    className="p-0.5 disabled:opacity-20"
                    style={{ color: "var(--dt-text-muted)" }}
                    aria-label={t("group.moveUp")}
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => ctx.onReorderMember(gIdx, mIdx, 1)}
                    disabled={mIdx === groupMembers.length - 1}
                    className="p-0.5 disabled:opacity-20"
                    style={{ color: "var(--dt-text-muted)" }}
                    aria-label={t("group.moveDown")}
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
                <DragGrip {...ctx.dragHandle({ kind: "member", gIdx, mIdx })} />
                <button
                  type="button"
                  onClick={() => ctx.onToggleColor(colorKey)}
                  className="size-6 sm:size-7 rounded-full shrink-0 theme-border transition-transform hover:scale-110"
                  style={{ backgroundColor: member.color, borderWidth: "2px" }}
                  aria-label={t("group.changeColor")}
                />
                <input
                  type="text"
                  value={member.name}
                  onChange={e =>
                    ctx.onMemberNameChange(member.id, e.target.value)
                  }
                  maxLength={LIMITS.memberName}
                  placeholder={t("group.namePlaceholder")}
                  className="flex-1 min-w-0 theme-border px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium"
                  style={{
                    borderRadius: "var(--dt-border-radius-sm)",
                    backgroundColor: "var(--dt-button-bg)",
                  }}
                  aria-label={t("group.memberName")}
                />
                <button
                  type="button"
                  onClick={() => ctx.onRemoveMemberFromGroup(gIdx, member.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-30"
                  style={{ color: "#DC2626" }}
                  disabled={groupMembers.length <= 1}
                  aria-label={t("group.excludeMember", { name: member.name })}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <div className="pl-7 sm:pl-[1.75rem]">
                {ctx.openColorKey === colorKey && (
                  <div className="mt-1.5 mb-1">
                    <ColorPalette
                      member={member}
                      onPresetSelect={ctx.onColorPreset}
                      onCustomColor={ctx.onColorCustom}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      {!isImplicitAll && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => ctx.onResetToAllMembers(gIdx)}
            className="text-xs font-bold hover:underline"
            style={{ color: "var(--dt-text-muted)" }}
          >
            {t("group.resetToAll")}
          </button>
          {unassignedMembers.length > 0 && (
            <button
              type="button"
              onClick={() =>
                ctx.onAddMemberToGroup(gIdx, unassignedMembers[0].id)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold hover:bg-black/5 rounded-lg transition-colors"
              style={{ color: "var(--dt-text-secondary)" }}
            >
              <Plus className="size-3.5" aria-hidden="true" />{" "}
              {t("group.addMember")}
            </button>
          )}
          <button
            type="button"
            onClick={() => ctx.onAddNewMemberToGroup(gIdx)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold hover:bg-black/5 rounded-lg transition-colors"
            style={{ color: "var(--dt-text-secondary)" }}
          >
            <Plus className="size-3.5" aria-hidden="true" />{" "}
            {t("group.newMember")}
          </button>
        </div>
      )}
    </div>
  );
}

// --- 担当者モード: タスク一覧 ---

function AssigneeModeTaskList({
  group,
  gIdx,
}: {
  group: TaskGroup;
  gIdx: number;
}) {
  const ctx = useGroupCardContext();
  const t = useT();

  return (
    <>
      {group.tasks.map((task, tIdx) => {
        const drop =
          ctx.dropTarget?.gIdx === gIdx && ctx.dropTarget.idx === tIdx
            ? ctx.dropTarget
            : null;
        return (
          <div
            key={`${group.id}-t${tIdx}`}
            className="relative flex items-center gap-2 transition-all duration-150"
            data-drag-item
            data-drop-task={`${gIdx}:${tIdx}`}
          >
            {drop && <DropLine after={drop.after} />}
            <div className="flex flex-col shrink-0 sm:hidden">
              <button
                type="button"
                onClick={() => ctx.onMoveTask(gIdx, tIdx, -1)}
                disabled={tIdx === 0}
                className="p-0.5 disabled:opacity-20"
                style={{ color: "var(--dt-text-muted)" }}
                aria-label={t("group.moveUp")}
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => ctx.onMoveTask(gIdx, tIdx, 1)}
                disabled={tIdx === group.tasks.length - 1}
                className="p-0.5 disabled:opacity-20"
                style={{ color: "var(--dt-text-muted)" }}
                aria-label={t("group.moveDown")}
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
            <DragGrip {...ctx.dragHandle({ kind: "task", gIdx, tIdx })} />
            <input
              type="text"
              value={task}
              onChange={e => ctx.onUpdateTask(gIdx, tIdx, e.target.value)}
              maxLength={LIMITS.task}
              placeholder={t("group.taskNamePlaceholder")}
              className="flex-1 min-w-0 theme-border px-3 py-2 text-sm font-medium"
              style={{
                borderRadius: "var(--dt-border-radius-sm)",
                backgroundColor: "var(--dt-button-bg)",
              }}
              aria-label={t("group.taskAt", { g: gIdx + 1, t: tIdx + 1 })}
            />
            <button
              type="button"
              onClick={() => ctx.onRemoveTask(gIdx, tIdx)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              style={{ color: "#DC2626" }}
              aria-label={t("group.deleteTask", {
                task: task || t("group.emptyTask"),
              })}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => ctx.onAddTask(gIdx)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold self-start hover:bg-black/5 rounded-lg transition-colors"
        style={{ color: "var(--dt-text-secondary)" }}
      >
        <Plus className="size-3.5" aria-hidden="true" /> {t("group.addTask")}
      </button>
    </>
  );
}

// つまむ印。ここを押したまま動かすと並べ替えられる（マウスでも指でも）。指で押したときに
// 画面がスクロールしないよう touch-action を止め、押しやすいよう周りを広めに取る
function DragGrip(props: {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <span
      {...props}
      data-drag-grip
      className="shrink-0 -m-1.5 p-1.5 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ color: "var(--dt-text-muted)" }}
      aria-hidden="true"
    >
      <GripVertical className="size-4" />
    </span>
  );
}

// 並べ替えで落とす位置の線。after なら行の下、そうでなければ上に出す
function DropLine({ after }: { after: boolean }) {
  return (
    <div
      className={`absolute left-0 right-0 h-0.5 rounded-full ${after ? "-bottom-1.5" : "-top-1.5"}`}
      style={{ backgroundColor: "var(--dt-focus-ring)" }}
    />
  );
}
