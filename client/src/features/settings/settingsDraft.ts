import type { ScheduleSettings } from "@/hooks/useScheduleManager";
import type { Member, RotationConfig, TaskGroup } from "@/rotation/types";
import type { MessageKey } from "@/i18n";
import type { FontId } from "@shared/appearance";
import { LIMITS } from "@shared/limits";
import { MEMBER_PRESETS } from "@/rotation/constants";
import { deepClone, generateId } from "@/rotation/utils";

export type SettingsDraft = ScheduleSettings & {
  rotationConfig: RotationConfig;
  assignmentMode: "member" | "task";
  fontId: FontId;
};

export function createSettingsDraft(
  settings: ScheduleSettings,
  fallbackFontId: FontId
): SettingsDraft {
  return {
    ...deepClone(settings),
    rotationConfig: deepClone(settings.rotationConfig ?? { mode: "manual" }),
    assignmentMode: settings.assignmentMode ?? "member",
    fontId: settings.fontId ?? fallbackFontId,
  };
}

export function changeDraftAssignmentMode(
  draft: SettingsDraft,
  mode: SettingsDraft["assignmentMode"],
  newTaskName: string
): SettingsDraft {
  let { groups, members } = draft;
  if (mode === "member") {
    if (groups.length > members.length) {
      members = [...members];
      while (members.length < groups.length) {
        const preset = MEMBER_PRESETS[members.length % MEMBER_PRESETS.length];
        members.push({ id: generateId("m"), name: "", ...preset });
      }
    } else if (members.length > groups.length) {
      groups = [...groups];
      while (groups.length < members.length) {
        groups.push({
          id: generateId("g"),
          tasks: [newTaskName],
          emoji: "✨",
        });
      }
    }
  }
  return { ...draft, assignmentMode: mode, groups, members };
}

type SaveResult =
  | { ok: true; settings: ScheduleSettings }
  | { ok: false; key: MessageKey; params?: { n: number } };

/** 空欄を含む下書きから、対応関係と上限を守った保存内容を作る。 */
export function prepareSettingsSave(
  draft: SettingsDraft,
  originalName: string
): SaveResult {
  const groups = draft.groups.map(group => ({
    ...group,
    emoji: group.emoji.trim() || "✨",
    tasks: group.tasks.filter(task => task.trim() !== ""),
  }));

  if (draft.assignmentMode === "member") {
    // 人と仕事は同じ順番で対になっている。片側だけを取り除くと担当がずれる。
    // 行の削除は編集画面の削除操作で行い、保存時には入力を残して知らせる。
    const emptyGroup = groups.findIndex(group => group.tasks.length === 0);
    if (emptyGroup !== -1)
      return {
        ok: false,
        key: "settings.errorEmptyGroup",
        params: { n: emptyGroup + 1 },
      };
    const emptyOwner = draft.members
      .slice(0, groups.length)
      .findIndex(member => member.name.trim() === "");
    if (emptyOwner !== -1)
      return {
        ok: false,
        key: "settings.errorEmptyOwner",
        params: { n: emptyOwner + 1 },
      };
  }

  // 仕事ごとの割当と、仕事のない追加メンバー欄は、空欄を除く従来の挙動を保つ。
  const members = draft.members.filter(member => member.name.trim() !== "");
  const cleanedGroups = groups.filter(group => group.tasks.length > 0);
  if (cleanedGroups.length === 0)
    return { ok: false, key: "settings.errorNeedTask" };
  if (members.length === 0)
    return { ok: false, key: "settings.errorNeedMember" };
  if (cleanedGroups.length > LIMITS.groups)
    return {
      ok: false,
      key: "settings.maxGroupsReached",
      params: { n: LIMITS.groups },
    };
  if (members.length > LIMITS.members)
    return {
      ok: false,
      key: "settings.maxMembersReached",
      params: { n: LIMITS.members },
    };
  if (cleanedGroups.some(group => group.tasks.length > LIMITS.tasksPerGroup))
    return {
      ok: false,
      key: "settings.maxTasksReached",
      params: { n: LIMITS.tasksPerGroup },
    };

  const activeMemberIds = members.flatMap(member =>
    member.skipped ? [] : [member.id]
  );
  return {
    ok: true,
    settings: {
      ...draft,
      name: draft.name.trim() || originalName,
      members,
      groups: cleanedGroups.map(group =>
        cleanMemberPool(group, activeMemberIds)
      ),
    },
  };
}

function cleanMemberPool(group: TaskGroup, activeMemberIds: Member["id"][]) {
  if (!group.memberIds) return group;
  const validIds = group.memberIds.filter(id => activeMemberIds.includes(id));
  const isDefaultOrder =
    validIds.length === activeMemberIds.length &&
    activeMemberIds.every((id, index) => validIds[index] === id);
  if (validIds.length === 0 || isDefaultOrder) {
    const { memberIds: _, ...rest } = group;
    return rest;
  }
  return { ...group, memberIds: validIds };
}
