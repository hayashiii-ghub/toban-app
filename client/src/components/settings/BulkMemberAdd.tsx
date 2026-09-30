import { useState, useMemo } from "react";
import type { Member, TaskGroup } from "@/rotation/types";
import { MEMBER_PRESETS } from "@/rotation/constants";
import { generateId, deepClone } from "@/rotation/utils";
import { parseNames } from "@/rotation/templateSetup";
import { useT } from "@/i18n";
import { toast } from "sonner";
import { LIMITS } from "@shared/limits";

interface Props {
  members: Member[];
  groups: TaskGroup[];
  activeMemberIds: string[];
  isTaskMode: boolean;
  onMembersChange: (members: Member[]) => void;
  onGroupsChange: (groups: TaskGroup[]) => void;
  onClose: () => void;
}

export function BulkMemberAdd({
  members,
  groups,
  activeMemberIds,
  isTaskMode,
  onMembersChange,
  onGroupsChange,
  onClose,
}: Props) {
  const t = useT();
  const [bulkText, setBulkText] = useState("");
  const bulkNames = useMemo(() => parseNames(bulkText), [bulkText]);

  const handleBulkAdd = () => {
    if (bulkNames.length === 0) return;
    if (members.length + bulkNames.length > LIMITS.members) {
      toast.error(t("settings.maxMembersReached", { n: LIMITS.members }));
      return;
    }
    if (!isTaskMode && groups.length + bulkNames.length > LIMITS.groups) {
      toast.error(t("settings.maxGroupsReached", { n: LIMITS.groups }));
      return;
    }
    const newMembers = bulkNames.map((name, i) => {
      const preset =
        MEMBER_PRESETS[(members.length + i) % MEMBER_PRESETS.length];
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
      const newGroups = newMembers.map(
        () =>
          ({
            id: generateId("g"),
            tasks: [t("settings.newTask")],
            emoji: "✨",
          }) as TaskGroup
      );
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
        onChange={e => setBulkText(e.target.value)}
        placeholder={
          isTaskMode ? t("bulk.placeholderTask") : t("bulk.placeholderMember")
        }
        rows={5}
        className="theme-border px-3 py-2 text-sm font-medium resize-none"
        style={{
          borderRadius: "var(--dt-border-radius-sm)",
          backgroundColor: "#fff",
        }}
        aria-label={isTaskMode ? t("bulk.ariaTask") : t("bulk.ariaMember")}
      />
      {bulkNames.length > 0 && (
        <p
          className="text-xs font-bold"
          style={{ color: "var(--dt-text-secondary)" }}
        >
          {t("bulk.willAdd", { n: bulkNames.length })}
        </p>
      )}
      <button
        type="button"
        onClick={handleBulkAdd}
        disabled={bulkNames.length === 0}
        className="theme-border theme-shadow-sm flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm transition-all duration-150 theme-hover-lift disabled:opacity-40"
        // 編集画面の「保存する」と同じ色
        style={{
          backgroundColor: "var(--dt-control-bar-bg)",
          color: "var(--dt-control-bar-text)",
          borderRadius: "10px",
        }}
      >
        {t("bulk.add")}
      </button>
    </div>
  );
}
