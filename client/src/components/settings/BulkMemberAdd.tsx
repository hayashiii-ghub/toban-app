import { useState, useMemo } from "react";
import type { Member, TaskGroup } from "@/rotation/types";
import { MEMBER_PRESETS } from "@/rotation/constants";
import { generateId, deepClone } from "@/rotation/utils";

interface Props {
  members: Member[];
  groups: TaskGroup[];
  activeMemberIds: string[];
  isTaskMode: boolean;
  onMembersChange: (members: Member[]) => void;
  onGroupsChange: (groups: TaskGroup[]) => void;
  onClose: () => void;
}

export function BulkMemberAdd({ members, groups, activeMemberIds, isTaskMode, onMembersChange, onGroupsChange, onClose }: Props) {
  const [bulkText, setBulkText] = useState("");
  const bulkNames = useMemo(
    () => bulkText.split(/[\n,、\t]+/).map((s) => s.trim()).filter(Boolean),
    [bulkText],
  );

  const handleBulkAdd = () => {
    if (bulkNames.length === 0) return;
    const newMembers = bulkNames.map((name, i) => {
      const preset = MEMBER_PRESETS[(members.length + i) % MEMBER_PRESETS.length];
      return { id: generateId("m"), name, ...preset } as Member;
    });
    if (isTaskMode) {
      onMembersChange([...members, ...newMembers]);
      const next = deepClone(groups);
      const newIds = newMembers.map(m => m.id);
      for (const group of next) {
        const existing = group.memberIds ?? activeMemberIds;
        group.memberIds = [...existing, ...newIds];
      }
      onGroupsChange(next);
    } else {
      const newGroups = newMembers.map(() => ({
        id: generateId("g"),
        tasks: ["新しいタスク"],
        emoji: "✨",
      } as TaskGroup));
      onMembersChange([...members, ...newMembers]);
      onGroupsChange([...groups, ...newGroups]);
    }
    setBulkText("");
    onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder={isTaskMode ? "メンバー名を入力（1行に1人、またはカンマ区切り）\n例：田中, 佐藤, 鈴木\n（全タスクに追加されます）" : "名前を入力（1行に1人、またはカンマ区切り）\n例：田中, 佐藤, 鈴木\n（グループも同時に作成されます）"}
        rows={5}
        className="theme-border px-3 py-2 text-sm font-medium resize-none"
        style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#fff" }}
        aria-label={isTaskMode ? "メンバーを一括追加" : "メンバーとグループを一括追加"}
      />
      {bulkNames.length > 0 && (
        <p className="text-xs font-bold" style={{ color: "var(--dt-text-secondary)" }}>
          {bulkNames.length}人を追加します
        </p>
      )}
      <button type="button"
        onClick={handleBulkAdd}
        disabled={bulkNames.length === 0}
        className="theme-border theme-shadow-sm flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm text-white transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        style={{ backgroundColor: "#1a1a1a", borderRadius: "10px" }}
      >
        追加する
      </button>
    </div>
  );
}
