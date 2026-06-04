import { useEffect, useRef } from "react";
import type { useHomeState } from "@/pages/useHomeState";
import { MEMBER_PRESETS, TEMPLATES } from "@/rotation/constants";
import { generateId, normalizeRotation } from "@/rotation/utils";

/** useHomeState() の戻り値。tool はこの派生値/ハンドラだけを介して動く。 */
type HomeState = ReturnType<typeof useHomeState>;

const VIEW_LABELS = { cards: "カード", table: "表", calendar: "カレンダー" } as const;
type ViewKey = keyof typeof VIEW_LABELS;

function result(text: string): WebMCPToolResult {
  return { content: [{ type: "text", text }] };
}

function rotationLabel(rotation: number): string {
  return rotation === 0 ? "初期" : `${rotation}回目`;
}

/** input(JSON) から文字列フィールドを安全に取り出す。schema は緩いのでここで検証する。 */
function strField(input: unknown, key: string): string {
  const obj = (input ?? {}) as Record<string, unknown>;
  return typeof obj[key] === "string" ? (obj[key] as string).trim() : "";
}

/** input(JSON) から数値フィールドを安全に取り出す。数値でなければ null。 */
function numField(input: unknown, key: string): number | null {
  const obj = (input ?? {}) as Record<string, unknown>;
  return typeof obj[key] === "number" ? (obj[key] as number) : null;
}

function listSchedulesTool(get: () => HomeState): WebMCPTool {
  return {
    name: "list_schedules",
    description:
      "List all duty rosters (当番表) the user has. Returns each roster's name, member count, and group count; the currently displayed roster is marked. Use to see what rosters exist or before switching rosters.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const { state, activeSchedule } = get();
      const { schedules } = state;
      if (schedules.length === 0) return result("当番表がありません。");
      const lines = schedules.map((s) => {
        const active = s.id === activeSchedule?.id ? "（表示中）" : "";
        return `- ${s.name}${active}: メンバー${s.members.length}人 / グループ${s.groups.length}組`;
      });
      return result(`当番表が${schedules.length}件あります。\n${lines.join("\n")}`);
    },
  };
}

function currentAssignmentsTool(get: () => HomeState): WebMCPTool {
  return {
    name: "get_current_assignments",
    description:
      "Get who is currently on duty for the active duty roster: each task group paired with its assigned member, plus the current rotation step. Use when the user asks who is on duty now.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const { activeSchedule, assignments, effectiveRotation } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      if (assignments.length === 0) {
        return result(`「${activeSchedule.name}」には担当できるメンバーがいません。`);
      }
      const lines = assignments.map(
        ({ group, member }) => `- ${group.emoji} ${group.tasks.join("・")} → ${member.name}`,
      );
      return result(
        `「${activeSchedule.name}」の現在の担当（${rotationLabel(effectiveRotation)}）:\n${lines.join("\n")}`,
      );
    },
  };
}

function scheduleDetailsTool(get: () => HomeState): WebMCPTool {
  return {
    name: "get_schedule_details",
    description:
      "Get the full setup of the active duty roster: member names, task groups, rotation mode (manual or date-based), and assignment mode. Use before editing or to explain how the roster is configured.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const { activeSchedule } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      const mode = activeSchedule.rotationConfig?.mode === "date" ? "日付ベース" : "手動";
      const assignMode = activeSchedule.assignmentMode === "task" ? "タスクごと" : "担当者ごと";
      const members = activeSchedule.members.map((m) => m.name).join("、");
      const groups = activeSchedule.groups.map((g) => `- ${g.emoji} ${g.tasks.join("・")}`);
      return result(
        [
          `「${activeSchedule.name}」の設定:`,
          `回転モード: ${mode} / 割り当て: ${assignMode}`,
          `メンバー: ${members}`,
          "グループ:",
          ...groups,
        ].join("\n"),
      );
    },
  };
}

function switchScheduleTool(get: () => HomeState): WebMCPTool {
  return {
    name: "switch_schedule",
    description:
      "Switch the active duty roster to the one with the given name. Use the exact roster name as shown by list_schedules.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Exact name of the roster to switch to" } },
      required: ["name"],
    },
    async execute(input) {
      const { state, selectSchedule } = get();
      const name = strField(input, "name");
      const target = state.schedules.find((s) => s.name === name);
      if (!target) {
        const names = state.schedules.map((s) => s.name).join("、");
        return result(`「${name}」という当番表は見つかりませんでした。利用できる当番表: ${names}`);
      }
      selectSchedule(target.id);
      return result(`「${target.name}」に切り替えました。`);
    },
  };
}

function advanceRotationTool(get: () => HomeState): WebMCPTool {
  return {
    name: "advance_rotation",
    description:
      "Move the active roster's rotation one step forward or backward. Only works for manually-rotated rosters; date-based rosters advance automatically by date and cannot be moved manually.",
    inputSchema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["forward", "backward"], description: "forward = next turn, backward = previous turn" },
      },
      required: ["direction"],
    },
    async execute(input) {
      const { activeSchedule, handleRotate } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      const direction = strField(input, "direction");
      if (direction !== "forward" && direction !== "backward") {
        return result('direction は "forward" または "backward" を指定してください。');
      }
      if (activeSchedule.rotationConfig?.mode === "date") {
        return result(
          `「${activeSchedule.name}」は日付ベースで自動的に当番が変わる設定のため、手動では回転できません。`,
        );
      }
      handleRotate(direction);
      const label = direction === "forward" ? "次へ進めました" : "前へ戻しました";
      return result(`「${activeSchedule.name}」の当番を1つ${label}。`);
    },
  };
}

function changeViewTool(get: () => HomeState): WebMCPTool {
  return {
    name: "change_view",
    description: "Switch how the active roster is displayed: cards, table, or calendar.",
    inputSchema: {
      type: "object",
      properties: { view: { type: "string", enum: ["cards", "table", "calendar"], description: "Display mode" } },
      required: ["view"],
    },
    async execute(input) {
      const { changeTab } = get();
      const view = strField(input, "view");
      if (view !== "cards" && view !== "table" && view !== "calendar") {
        return result('view は "cards" / "table" / "calendar" のいずれかを指定してください。');
      }
      changeTab(view as ViewKey);
      return result(`表示を「${VIEW_LABELS[view as ViewKey]}」に切り替えました。`);
    },
  };
}

function createScheduleTool(get: () => HomeState): WebMCPTool {
  return {
    name: "create_schedule",
    description:
      "Create a new duty roster from a built-in template, identified by the template's name. The new roster becomes the active one.",
    inputSchema: {
      type: "object",
      properties: { template: { type: "string", description: "Name of the template to create from" } },
      required: ["template"],
    },
    async execute(input) {
      const { onAddSchedule } = get();
      const name = strField(input, "template");
      const template = TEMPLATES.find((t) => t.name === name);
      if (!template) {
        const names = TEMPLATES.map((t) => t.name).join("、");
        return result(`「${name}」というテンプレートはありません。利用できるテンプレート: ${names}`);
      }
      onAddSchedule(template);
      return result(`テンプレート「${template.name}」から新しい当番表を作成しました。`);
    },
  };
}

function addMemberTool(get: () => HomeState): WebMCPTool {
  return {
    name: "add_member",
    description:
      "Add a member (a person or team) to the active duty roster by name. A display color is assigned automatically.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the member to add" } },
      required: ["name"],
    },
    async execute(input) {
      const { activeSchedule, onSaveSettings } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      const name = strField(input, "name");
      if (!name) return result("追加するメンバーの名前を指定してください。");
      const preset = MEMBER_PRESETS[activeSchedule.members.length % MEMBER_PRESETS.length];
      const nextMembers = [...activeSchedule.members, { id: generateId("m"), name, ...preset }];
      onSaveSettings(
        activeSchedule.name,
        activeSchedule.groups,
        nextMembers,
        activeSchedule.rotationConfig,
        activeSchedule.pinned,
        activeSchedule.assignmentMode,
        activeSchedule.designThemeId,
      );
      return result(`「${name}」をメンバーに追加しました。`);
    },
  };
}

function removeMemberTool(get: () => HomeState): WebMCPTool {
  return {
    name: "remove_member",
    description: "Remove a member from the active duty roster by name.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the member to remove" } },
      required: ["name"],
    },
    async execute(input) {
      const { activeSchedule, onSaveSettings } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      const name = strField(input, "name");
      const target = activeSchedule.members.find((m) => m.name === name);
      if (!target) {
        const names = activeSchedule.members.map((m) => m.name).join("、");
        return result(`「${name}」というメンバーは見つかりませんでした。現在のメンバー: ${names}`);
      }
      if (activeSchedule.members.length <= 1) {
        return result("最後のメンバーは削除できません。");
      }
      const nextMembers = activeSchedule.members.filter((m) => m.id !== target.id);
      const nextGroups = activeSchedule.groups.map((g) =>
        g.memberIds ? { ...g, memberIds: g.memberIds.filter((id) => id !== target.id) } : g,
      );
      onSaveSettings(
        activeSchedule.name,
        nextGroups,
        nextMembers,
        activeSchedule.rotationConfig,
        activeSchedule.pinned,
        activeSchedule.assignmentMode,
        activeSchedule.designThemeId,
      );
      return result(`「${target.name}」をメンバーから削除しました。`);
    },
  };
}

function setRotationTool(get: () => HomeState): WebMCPTool {
  return {
    name: "set_rotation",
    description:
      "Set the active roster's rotation to a specific turn number (0 = initial). Only for manually-rotated rosters; date-based rosters advance automatically.",
    inputSchema: {
      type: "object",
      properties: { rotation: { type: "number", description: "Turn number, 0 or greater" } },
      required: ["rotation"],
    },
    async execute(input) {
      const { activeSchedule, updateActiveSchedule } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      if (activeSchedule.rotationConfig?.mode === "date") {
        return result(
          `「${activeSchedule.name}」は日付ベースで自動的に当番が変わる設定のため、回数を手動で設定できません。`,
        );
      }
      const rotation = numField(input, "rotation");
      if (rotation === null || !Number.isInteger(rotation) || rotation < 0) {
        return result("rotation は 0 以上の整数で指定してください。");
      }
      const activeCount = activeSchedule.members.filter((m) => !m.skipped).length;
      const normalized = normalizeRotation(rotation, activeCount);
      updateActiveSchedule((s) => ({ ...s, rotation: normalized }));
      return result(`回転を${normalized === 0 ? "初期" : `${normalized}回目`}に設定しました。`);
    },
  };
}

function printScheduleTool(get: () => HomeState): WebMCPTool {
  return {
    name: "print_schedule",
    description: "Open the browser print dialog for the active roster in its current view (cards / table / calendar).",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const { handlePrint, viewTab } = get();
      handlePrint(viewTab);
      return result(`印刷ダイアログを開きました（${VIEW_LABELS[viewTab as ViewKey] ?? viewTab}表示）。`);
    },
  };
}

function shareLinkTool(get: () => HomeState): WebMCPTool {
  return {
    name: "get_share_link",
    description:
      "Get the public share URL of the active roster if it has already been shared. Does NOT create or publish a new link — sharing must be done by the user via the share button.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const { activeSchedule } = get();
      if (!activeSchedule) return result("現在選択されている当番表がありません。");
      if (activeSchedule.slug) {
        return result(`「${activeSchedule.name}」の共有リンク: ${window.location.origin}/s/${activeSchedule.slug}`);
      }
      return result(
        `「${activeSchedule.name}」はまだ共有されていません。画面の共有ボタンから共有リンクを作成できます。`,
      );
    },
  };
}

/** 登録する全 tool を組み立てる。get() は常に最新の HomeState を返すこと。 */
export function buildTobanTools(get: () => HomeState): WebMCPTool[] {
  return [
    listSchedulesTool(get),
    currentAssignmentsTool(get),
    scheduleDetailsTool(get),
    shareLinkTool(get),
    switchScheduleTool(get),
    advanceRotationTool(get),
    changeViewTool(get),
    createScheduleTool(get),
    addMemberTool(get),
    removeMemberTool(get),
    setRotationTool(get),
    printScheduleTool(get),
  ];
}

/**
 * Home 画面で WebMCP tool を登録する。
 * - navigator.modelContext (Chrome 実装) / document.modelContext (spec draft) を feature-detect
 * - 非対応ブラウザでは完全に no-op（既存挙動に影響なし）
 * - state は ref 経由で常に最新を参照（再登録の churn を避ける）
 */
export function useTobanTools(s: HomeState): void {
  const ref = useRef(s);
  useEffect(() => {
    ref.current = s;
  });

  useEffect(() => {
    const mc = navigator.modelContext ?? document.modelContext;
    if (!mc) return;
    const controller = new AbortController();
    for (const tool of buildTobanTools(() => ref.current)) {
      // registerTool は spec 上 throw しうる（permissions policy 等）。
      // 実験的 API の失敗で Home（= アプリ全体）を巻き込まないよう握りつぶす。
      try {
        mc.registerTool(tool, { signal: controller.signal });
      } catch (error) {
        console.warn(`[webmcp] registerTool failed: ${tool.name}`, error);
      }
    }
    return () => controller.abort();
  }, []);
}
