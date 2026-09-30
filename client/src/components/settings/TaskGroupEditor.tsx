import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import type { AssignmentMode, TaskGroup, Member } from "@/rotation/types";
import { MEMBER_PRESETS, colorPresetFromHex } from "@/rotation/constants";
import { generateId, deepClone } from "@/rotation/utils";
import { GroupCard } from "./GroupCard";
import {
  GroupCardProvider,
  type GroupCardContextValue,
} from "./GroupCardContext";
import { BulkMemberAdd } from "./BulkMemberAdd";
import { useT } from "@/i18n";
import { toast } from "sonner";
import { LIMITS } from "@shared/limits";

/** list の from 番目を to 番目へ移した新しい配列。隣への移動は入れ替えと同じ結果になる */
function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** つかんだ要素そのものを、ドラッグ中の見た目にする */
function startMoveDrag(e: React.DragEvent) {
  e.dataTransfer.effectAllowed = "move";
  if (e.currentTarget instanceof HTMLElement) {
    e.dataTransfer.setDragImage(
      e.currentTarget,
      e.currentTarget.offsetWidth / 2,
      20
    );
  }
}

interface Props {
  groups: TaskGroup[];
  members: Member[];
  onGroupsChange: (groups: TaskGroup[]) => void;
  onMembersChange: (members: Member[]) => void;
  assignmentMode?: AssignmentMode;
}

export function TaskGroupEditor({
  groups,
  members,
  onGroupsChange,
  onMembersChange,
  assignmentMode,
}: Props) {
  const t = useT();
  const isTaskMode = assignmentMode === "task";
  const activeMembers = useMemo(
    () => members.filter(member => member.name.trim() && !member.skipped),
    [members]
  );
  const activeMemberIds = useMemo(
    () => activeMembers.map(member => member.id),
    [activeMembers]
  );
  const membersById = useMemo(
    () => new Map(members.map(member => [member.id, member])),
    [members]
  );

  // --- 詳細展開 ---
  const [openDetailsKey, setOpenDetailsKey] = useState<string | null>(null);
  const handleToggleDetails = useCallback(
    (key: string) => setOpenDetailsKey(prev => (prev === key ? null : key)),
    []
  );

  // --- 一括追加 ---
  const [bulkMode, setBulkMode] = useState(members.length <= 1);

  // --- カラーパレット ---
  const [openColorKey, setOpenColorKey] = useState<string | null>(null);
  const handleToggleColor = useCallback(
    (key: string) => setOpenColorKey(prev => (prev === key ? null : key)),
    []
  );

  const updateMemberColor = (memberId: string, presetIdx: number) => {
    const preset = MEMBER_PRESETS[presetIdx];
    onMembersChange(
      members.map(m => (m.id === memberId ? { ...m, ...preset } : m))
    );
    setOpenColorKey(null);
  };

  const updateMemberColorCustom = (memberId: string, hex: string) => {
    const preset = colorPresetFromHex(hex);
    onMembersChange(
      members.map(m => (m.id === memberId ? { ...m, ...preset } : m))
    );
  };

  const updateMemberName = (memberId: string, name: string) => {
    onMembersChange(members.map(m => (m.id === memberId ? { ...m, name } : m)));
  };

  // --- タスクドラッグ&ドロップ ---
  const [dragTask, setDragTask] = useState<{
    gIdx: number;
    tIdx: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    gIdx: number;
    tIdx: number;
  } | null>(null);

  const handleTaskDragEnd = useCallback(() => {
    setDragTask(null);
    setDropTarget(null);
  }, []);

  const handleTaskDragStart = (
    e: React.DragEvent,
    gIdx: number,
    tIdx: number
  ) => {
    setDragTask({ gIdx, tIdx });
    startMoveDrag(e);
  };

  const handleTaskDragOver = (
    e: React.DragEvent,
    gIdx: number,
    tIdx: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragTask) return;
    if (dragTask.gIdx !== gIdx || dragTask.tIdx !== tIdx) {
      setDropTarget({ gIdx, tIdx });
    } else {
      setDropTarget(null);
    }
  };

  const handleTaskDrop = (
    e: React.DragEvent,
    targetGIdx: number,
    targetTIdx: number
  ) => {
    e.preventDefault();
    if (!dragTask) return;
    const { gIdx: srcGIdx, tIdx: srcTIdx } = dragTask;
    if (srcGIdx !== targetGIdx || srcTIdx !== targetTIdx) {
      const next = deepClone(groups);
      const [movedTask] = next[srcGIdx].tasks.splice(srcTIdx, 1);
      next[targetGIdx].tasks.splice(targetTIdx, 0, movedTask);
      onGroupsChange(next);
    }
    handleTaskDragEnd();
  };

  const handleGroupDropZone = (e: React.DragEvent, gIdx: number) => {
    e.preventDefault();
    if (!dragTask) return;
    const { gIdx: srcGIdx, tIdx: srcTIdx } = dragTask;
    const next = deepClone(groups);
    const [movedTask] = next[srcGIdx].tasks.splice(srcTIdx, 1);
    next[gIdx].tasks.push(movedTask);
    onGroupsChange(next);
    handleTaskDragEnd();
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    if (!dragTask) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // --- グループ並べ替えドラッグ&ドロップ ---
  const [dragGroupIdx, setDragGroupIdx] = useState<number | null>(null);
  const [dropGroupIdx, setDropGroupIdx] = useState<number | null>(null);

  const handleGroupReorderDragEnd = useCallback(() => {
    setDragGroupIdx(null);
    setDropGroupIdx(null);
  }, []);

  const handleGroupDragStart = (e: React.DragEvent, gIdx: number) => {
    e.stopPropagation();
    setDragGroupIdx(gIdx);
    startMoveDrag(e);
  };

  const handleGroupReorderDragOver = (e: React.DragEvent, gIdx: number) => {
    if (dragGroupIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropGroupIdx(dragGroupIdx !== gIdx ? gIdx : null);
  };

  const handleGroupReorderDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragGroupIdx !== null && dragGroupIdx !== targetIdx) {
      moveGroupTo(dragGroupIdx, targetIdx);
    }
    handleGroupReorderDragEnd();
  };

  // --- メンバー行ドラッグ&ドロップ（タスクモード用） ---
  const [dragMember, setDragMember] = useState<{
    gIdx: number;
    mIdx: number;
  } | null>(null);
  const [dropMemberTarget, setDropMemberTarget] = useState<{
    gIdx: number;
    mIdx: number;
  } | null>(null);

  const handleMemberDragEnd = useCallback(() => {
    setDragMember(null);
    setDropMemberTarget(null);
  }, []);

  const handleMemberDragStart = (
    e: React.DragEvent,
    gIdx: number,
    mIdx: number
  ) => {
    e.stopPropagation();
    setDragMember({ gIdx, mIdx });
    startMoveDrag(e);
  };

  const handleMemberDragOver = (
    e: React.DragEvent,
    gIdx: number,
    mIdx: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!dragMember || dragMember.gIdx !== gIdx) return;
    if (dragMember.mIdx !== mIdx) {
      setDropMemberTarget({ gIdx, mIdx });
    } else {
      setDropMemberTarget(null);
    }
  };

  const handleMemberDrop = (
    e: React.DragEvent,
    targetGIdx: number,
    targetMIdx: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // 別のグループの担当者の上には落とせない（グループをまたぐ移動は「追加」で行う）
    if (
      dragMember &&
      dragMember.gIdx === targetGIdx &&
      dragMember.mIdx !== targetMIdx
    ) {
      moveMemberTo(targetGIdx, dragMember.mIdx, targetMIdx);
    }
    handleMemberDragEnd();
  };

  // --- メンバーグループ操作（タスクモード） ---
  const removeMemberFromGroup = (gIdx: number, memberId: string) => {
    const next = deepClone(groups);
    const group = next[gIdx];
    const memberIds = group.memberIds ?? activeMemberIds;
    group.memberIds = memberIds.filter(id => id !== memberId);
    onGroupsChange(next);
  };

  const addMemberToGroup = (gIdx: number, memberId: string) => {
    const next = deepClone(groups);
    const group = next[gIdx];
    const memberIds = group.memberIds ?? activeMemberIds;
    group.memberIds = [...memberIds, memberId];
    onGroupsChange(next);
  };

  const addNewMemberToGroup = (gIdx: number) => {
    if (members.length >= LIMITS.members) {
      toast.error(t("settings.maxMembersReached", { n: LIMITS.members }));
      return;
    }
    const preset = MEMBER_PRESETS[members.length % MEMBER_PRESETS.length];
    const newMember: Member = { id: generateId("m"), name: "", ...preset };
    onMembersChange([...members, newMember]);
    const next = deepClone(groups);
    const group = next[gIdx];
    const memberIds = group.memberIds ?? activeMemberIds;
    group.memberIds = [...memberIds, newMember.id];
    onGroupsChange(next);
  };

  const setExplicitMembers = (gIdx: number) => {
    const next = [...groups];
    next[gIdx] = { ...next[gIdx], memberIds: activeMemberIds };
    onGroupsChange(next);
  };

  const resetToAllMembers = (gIdx: number) => {
    const next = [...groups];
    const { memberIds: _, ...rest } = next[gIdx];
    next[gIdx] = rest as TaskGroup;
    onGroupsChange(next);
  };

  const moveMemberTo = (gIdx: number, from: number, to: number) => {
    const next = deepClone(groups);
    next[gIdx].memberIds = moveItem(
      next[gIdx].memberIds ?? activeMemberIds,
      from,
      to
    );
    onGroupsChange(next);
  };

  const reorderMember = (gIdx: number, mIdx: number, direction: -1 | 1) => {
    const newIdx = mIdx + direction;
    const ids = groups[gIdx].memberIds ?? activeMemberIds;
    if (newIdx < 0 || newIdx >= ids.length) return;
    moveMemberTo(gIdx, mIdx, newIdx);
  };

  // --- グループ操作ヘルパー ---
  // 担当者から見るモードでは、グループと担当者が同じ順番で対になっている
  function moveGroupTo(from: number, to: number) {
    if (!isTaskMode) onMembersChange(moveItem(members, from, to));
    onGroupsChange(moveItem(groups, from, to));
  }

  const moveGroup = (gIdx: number, direction: -1 | 1) => {
    const newIdx = gIdx + direction;
    if (newIdx < 0 || newIdx >= groups.length) return;
    moveGroupTo(gIdx, newIdx);
  };

  const moveTask = (gIdx: number, tIdx: number, direction: -1 | 1) => {
    const newIdx = tIdx + direction;
    if (newIdx < 0 || newIdx >= groups[gIdx].tasks.length) return;
    onGroupsChange(
      groups.map((g, i) =>
        i === gIdx ? { ...g, tasks: moveItem(g.tasks, tIdx, newIdx) } : g
      )
    );
  };

  const addGroup = () => {
    if (groups.length >= LIMITS.groups) {
      toast.error(t("settings.maxGroupsReached", { n: LIMITS.groups }));
      return;
    }
    if (!isTaskMode && members.length >= LIMITS.members) {
      toast.error(t("settings.maxMembersReached", { n: LIMITS.members }));
      return;
    }
    if (isTaskMode) {
      const newGroup: TaskGroup = {
        id: generateId("g"),
        tasks: [t("settings.newTask")],
        emoji: "✨",
      };
      if (activeMemberIds.length > 0) newGroup.memberIds = activeMemberIds;
      onGroupsChange([...groups, newGroup]);
    } else {
      const preset = MEMBER_PRESETS[members.length % MEMBER_PRESETS.length];
      const newMember: Member = { id: generateId("m"), name: "", ...preset };
      const newGroup: TaskGroup = {
        id: generateId("g"),
        tasks: [t("settings.newTask")],
        emoji: "✨",
      };
      onMembersChange([...members, newMember]);
      onGroupsChange([...groups, newGroup]);
    }
  };

  const removeGroup = (idx: number) => {
    if (groups.length <= 1) return;
    if (!isTaskMode) {
      onMembersChange(members.filter((_, i) => i !== idx));
    }
    onGroupsChange(groups.filter((_, i) => i !== idx));
  };

  const updateGroupEmoji = (gIdx: number, emoji: string) => {
    onGroupsChange(groups.map((g, i) => (i === gIdx ? { ...g, emoji } : g)));
  };

  const addTask = (gIdx: number) => {
    if ((groups[gIdx]?.tasks.length ?? 0) >= LIMITS.tasksPerGroup) {
      toast.error(t("settings.maxTasksReached", { n: LIMITS.tasksPerGroup }));
      return;
    }
    onGroupsChange(
      groups.map((g, i) => (i === gIdx ? { ...g, tasks: [...g.tasks, ""] } : g))
    );
  };

  const updateTask = (gIdx: number, tIdx: number, value: string) => {
    onGroupsChange(
      groups.map((g, i) =>
        i === gIdx
          ? { ...g, tasks: g.tasks.map((t, j) => (j === tIdx ? value : t)) }
          : g
      )
    );
  };

  const removeTask = (gIdx: number, tIdx: number) => {
    onGroupsChange(
      groups.map((g, i) =>
        i === gIdx ? { ...g, tasks: g.tasks.filter((_, j) => j !== tIdx) } : g
      )
    );
  };

  const contextValue: GroupCardContextValue = useMemo(
    () => ({
      isTaskMode,
      activeMembers,
      activeMemberIds,
      membersById,
      openDetailsKey,
      onToggleDetails: handleToggleDetails,
      openColorKey,
      onToggleColor: handleToggleColor,
      onColorPreset: updateMemberColor,
      onColorCustom: updateMemberColorCustom,
      onMemberNameChange: updateMemberName,
      onMoveGroup: moveGroup,
      onRemoveGroup: removeGroup,
      onUpdateEmoji: updateGroupEmoji,
      onAddTask: addTask,
      onUpdateTask: updateTask,
      onRemoveTask: removeTask,
      onMoveTask: moveTask,
      onRemoveMemberFromGroup: removeMemberFromGroup,
      onAddMemberToGroup: addMemberToGroup,
      onAddNewMemberToGroup: addNewMemberToGroup,
      onSetExplicitMembers: setExplicitMembers,
      onResetToAllMembers: resetToAllMembers,
      onReorderMember: reorderMember,
      dragGroupIdx,
      onGroupDragStart: handleGroupDragStart,
      onGroupDragEnd: handleGroupReorderDragEnd,
      onGroupReorderDragOver: handleGroupReorderDragOver,
      onGroupReorderDrop: handleGroupReorderDrop,
      dragTask,
      dropTarget,
      onTaskDragStart: handleTaskDragStart,
      onTaskDragOver: handleTaskDragOver,
      onTaskDrop: handleTaskDrop,
      onTaskDragEnd: handleTaskDragEnd,
      onGroupDragOver: handleGroupDragOver,
      onGroupDropZone: handleGroupDropZone,
      dragMember,
      dropMemberTarget,
      onMemberDragStart: handleMemberDragStart,
      onMemberDragOver: handleMemberDragOver,
      onMemberDrop: handleMemberDrop,
      onMemberDragEnd: handleMemberDragEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are recreated when groups/members change; useMemo prevents re-renders on unrelated state (bulkMode)
    [
      isTaskMode,
      activeMembers,
      activeMemberIds,
      membersById,
      openDetailsKey,
      openColorKey,
      dragGroupIdx,
      dragTask,
      dropTarget,
      dragMember,
      dropMemberTarget,
      groups,
      members,
      onGroupsChange,
      onMembersChange,
      handleToggleDetails,
      handleToggleColor,
      handleTaskDragEnd,
      handleGroupReorderDragEnd,
      handleMemberDragEnd,
    ]
  );

  return (
    <div className="flex flex-col gap-3">
      <GroupCardProvider value={contextValue}>
        <div
          className={`flex flex-col gap-3 ${groups.length > 8 ? "max-h-[400px] overflow-y-auto pr-1" : ""}`}
        >
          {groups.map((group, gIdx) => (
            <GroupCard
              key={group.id}
              group={group}
              gIdx={gIdx}
              groupCount={groups.length}
              ownerMember={!isTaskMode ? members[gIdx] : undefined}
              isGroupDragging={dragGroupIdx === gIdx}
              isGroupDropTarget={dropGroupIdx === gIdx}
            />
          ))}
        </div>
      </GroupCardProvider>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addGroup}
          // 行を足すボタンだと分かるよう点線の枠にする
          className="theme-border flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-colors hover:bg-black/5"
          style={{
            borderStyle: "dashed",
            backgroundColor: "transparent",
            color: "var(--dt-text-secondary)",
            borderRadius: "10px",
          }}
        >
          <Plus className="size-4" aria-hidden="true" />{" "}
          {isTaskMode ? t("group.addTask") : t("group.addAssignee")}
        </button>
        <button
          type="button"
          onClick={() => setBulkMode(v => !v)}
          className="theme-border theme-shadow-sm flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-all duration-150 theme-hover-lift"
          style={{
            backgroundColor: bulkMode
              ? "var(--dt-current-highlight)"
              : "var(--dt-button-bg)",
            color: "var(--dt-text)",
            borderRadius: "10px",
          }}
        >
          {t("bulk.bulkAdd")}
        </button>
      </div>

      {bulkMode && (
        <BulkMemberAdd
          members={members}
          groups={groups}
          activeMemberIds={activeMemberIds}
          isTaskMode={isTaskMode}
          onMembersChange={onMembersChange}
          onGroupsChange={onGroupsChange}
          onClose={() => setBulkMode(false)}
        />
      )}
    </div>
  );
}
