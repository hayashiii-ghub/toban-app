import { useState, useCallback, useRef, useId } from "react";
import { m } from "framer-motion";
import { X, Save, Copy, Trash2 } from "lucide-react";
import type {
  AssignmentMode,
  TaskGroup,
  Member,
  RotationConfig,
} from "@/rotation/types";
import { deepClone, generateId } from "@/rotation/utils";
import { MEMBER_PRESETS } from "@/rotation/constants";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { ScheduleSettings } from "@/hooks/useScheduleManager";
import { LIMITS } from "@shared/limits";
import { TaskGroupEditor } from "./settings/TaskGroupEditor";
import { DesignThemePicker } from "./settings/DesignThemePicker";
import { FontPicker } from "./settings/FontPicker";
import { RotationConfigEditor } from "./settings/RotationConfigEditor";
import { getThemeById, getThemeLabel } from "@/rotation/designThemes";
import { applyFont, getFontById, getSavedFontId } from "@/fonts";
import type { FontId } from "@shared/appearance";
import { applyThemeToRoot } from "@/contexts/DesignThemeContext";
import { useLocale, useT, type MessageKey } from "@/i18n";

interface Props {
  scheduleName: string;
  groups: TaskGroup[];
  members: Member[];
  rotationConfig?: RotationConfig;
  pinned?: boolean;
  assignmentMode?: AssignmentMode;
  designThemeId?: string;
  fontId?: FontId;
  canDelete: boolean;
  onSave: (settings: ScheduleSettings) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

type EditorTab = "content" | "rotation" | "appearance" | "advanced";

// 上に並べて、どの項目にもすぐ移れるようにする（開いた項目を閉じないと下が見えない、をなくす）
const EDITOR_TABS: { id: EditorTab; label: MessageKey }[] = [
  { id: "content", label: "settings.sectionContent" },
  { id: "rotation", label: "settings.sectionRotation" },
  { id: "appearance", label: "settings.sectionAppearance" },
  { id: "advanced", label: "settings.sectionAdvanced" },
];

type EditorPatch = {
  name?: string;
  groups?: TaskGroup[];
  members?: Member[];
  rotationConfig?: RotationConfig;
  assignmentMode?: AssignmentMode;
  designThemeId?: string | undefined;
  fontId?: FontId;
};

export function SettingsModal({
  scheduleName,
  groups,
  members,
  rotationConfig,
  pinned,
  assignmentMode,
  designThemeId,
  fontId: savedFontId,
  canDelete,
  onSave,
  onDuplicate,
  onDelete,
  onClose,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [editName, setEditName] = useState(scheduleName);
  const [editGroups, setEditGroups] = useState<TaskGroup[]>(() =>
    deepClone(groups)
  );
  const [editMembers, setEditMembers] = useState<Member[]>(() =>
    deepClone(members)
  );
  const [editRotationConfig, setEditRotationConfig] = useState<RotationConfig>(
    rotationConfig ?? { mode: "manual" }
  );
  const [editAssignmentMode, setEditAssignmentMode] = useState<AssignmentMode>(
    assignmentMode ?? "member"
  );
  const [editDesignThemeId, setEditDesignThemeId] = useState<
    string | undefined
  >(designThemeId);
  const [fontId, setFontId] = useState<FontId>(savedFontId ?? getSavedFontId());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 初期値のJSON文字列を一度だけ計算してキャッシュ（isDirty比較用）
  const initialGroupsJson = useRef(JSON.stringify(groups));
  const initialMembersJson = useRef(JSON.stringify(members));
  const initialRotationConfigJson = useRef(
    JSON.stringify(rotationConfig ?? { mode: "manual" })
  );

  const modalRef = useRef<HTMLDivElement>(null);

  const computeDirty = useCallback(
    (patch: EditorPatch = {}) => {
      const nextName = "name" in patch ? (patch.name ?? "") : editName;
      const nextGroups =
        "groups" in patch ? (patch.groups ?? editGroups) : editGroups;
      const nextMembers =
        "members" in patch ? (patch.members ?? editMembers) : editMembers;
      const nextRotationConfig =
        "rotationConfig" in patch
          ? (patch.rotationConfig ?? editRotationConfig)
          : editRotationConfig;
      const nextAssignmentMode =
        "assignmentMode" in patch
          ? (patch.assignmentMode ?? "member")
          : editAssignmentMode;
      const nextDesignThemeId =
        "designThemeId" in patch ? patch.designThemeId : editDesignThemeId;
      const nextFontId = "fontId" in patch ? (patch.fontId ?? fontId) : fontId;

      if (nextName !== scheduleName) return true;
      if (nextAssignmentMode !== (assignmentMode ?? "member")) return true;
      if (nextDesignThemeId !== designThemeId) return true;
      if (nextFontId !== (savedFontId ?? getSavedFontId())) return true;
      if (JSON.stringify(nextGroups) !== initialGroupsJson.current) return true;
      if (JSON.stringify(nextMembers) !== initialMembersJson.current)
        return true;
      if (
        JSON.stringify(nextRotationConfig) !== initialRotationConfigJson.current
      )
        return true;
      return false;
    },
    [
      assignmentMode,
      designThemeId,
      editAssignmentMode,
      editDesignThemeId,
      editGroups,
      fontId,
      editMembers,
      editName,
      editRotationConfig,
      scheduleName,
      savedFontId,
    ]
  );

  const applyEditorPatch = useCallback(
    (patch: EditorPatch) => {
      if ("name" in patch) setEditName(patch.name ?? "");
      if ("groups" in patch) setEditGroups(patch.groups ?? []);
      if ("members" in patch) setEditMembers(patch.members ?? []);
      if ("rotationConfig" in patch && patch.rotationConfig)
        setEditRotationConfig(patch.rotationConfig);
      if ("assignmentMode" in patch && patch.assignmentMode)
        setEditAssignmentMode(patch.assignmentMode);
      if ("designThemeId" in patch) setEditDesignThemeId(patch.designThemeId);
      if ("fontId" in patch && patch.fontId) setFontId(patch.fontId);
      setIsDirty(computeDirty(patch));
    },
    [computeDirty]
  );

  const updateRotationConfig = useCallback(
    (updater: (prev: RotationConfig) => RotationConfig) => {
      applyEditorPatch({ rotationConfig: updater(editRotationConfig) });
    },
    [applyEditorPatch, editRotationConfig]
  );

  const handleThemePreview = useCallback(
    (themeId: string) => {
      applyEditorPatch({ designThemeId: themeId });
      applyThemeToRoot(getThemeById(themeId));
    },
    [applyEditorPatch]
  );

  const handleFontPreview = useCallback(
    (nextFontId: FontId) => {
      applyEditorPatch({ fontId: nextFontId });
      applyFont(getFontById(nextFontId));
    },
    [applyEditorPatch]
  );

  const handleAssignmentModeChange = useCallback(
    (mode: AssignmentMode) => {
      let nextGroups = editGroups;
      let nextMembers = editMembers;

      if (mode === "member") {
        if (editGroups.length > editMembers.length) {
          const missing = editGroups.length - editMembers.length;
          nextMembers = [...editMembers];
          for (let i = 0; i < missing; i++) {
            const preset =
              MEMBER_PRESETS[(editMembers.length + i) % MEMBER_PRESETS.length];
            nextMembers.push({ id: generateId("m"), name: "", ...preset });
          }
        } else if (editMembers.length > editGroups.length) {
          const extra = editMembers.length - editGroups.length;
          nextGroups = [...editGroups];
          for (let i = 0; i < extra; i++) {
            nextGroups.push({
              id: generateId("g"),
              tasks: [t("settings.newTask")],
              emoji: "✨",
            });
          }
        }
      }

      applyEditorPatch({
        assignmentMode: mode,
        groups: nextGroups,
        members: nextMembers,
      });
    },
    [applyEditorPatch, editGroups, editMembers, t]
  );

  const revertThemePreview = useCallback(() => {
    if (editDesignThemeId !== designThemeId) {
      handleThemePreview(designThemeId ?? "whiteboard");
    }
    applyFont(getFontById(savedFontId ?? getSavedFontId()));
  }, [editDesignThemeId, designThemeId, handleThemePreview, savedFontId]);

  const handleCloseWithCheck = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t("settings.confirmClose"))) {
        revertThemePreview();
        onClose();
      }
    } else {
      revertThemePreview();
      onClose();
    }
  }, [isDirty, onClose, revertThemePreview, t]);

  useEscapeKey(
    useCallback(() => handleCloseWithCheck(), [handleCloseWithCheck])
  );
  useFocusTrap(modalRef, true);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleCloseWithCheck();
    }
  };

  const handleSave = () => {
    setValidationError(null);
    const cleanedMembers = editMembers.filter(m => m.name.trim() !== "");
    const activeMemberIds = cleanedMembers.flatMap(m =>
      m.skipped ? [] : [m.id]
    );
    const cleanedGroups = editGroups
      .map(g => {
        // 絵文字は空欄にできるが、サーバは min(1) を要求する。空のまま送ると PUT が
        // 400 になり、同期が黙って止まる（syncManager は 400 を破棄する）ため既定へ戻す。
        const cleaned = {
          ...g,
          emoji: g.emoji.trim() || "✨",
          tasks: g.tasks.filter(t => t.trim() !== ""),
        };
        if (cleaned.memberIds) {
          const validIds = cleaned.memberIds.filter(id =>
            activeMemberIds.includes(id)
          );
          if (validIds.length === 0) {
            delete cleaned.memberIds;
          } else if (validIds.length >= activeMemberIds.length) {
            // 全員いるが、並び順がデフォルトと同じなら不要なので消す
            const isSameOrder =
              validIds.length === activeMemberIds.length &&
              activeMemberIds.every((id, i) => validIds[i] === id);
            if (isSameOrder) {
              delete cleaned.memberIds;
            } else {
              cleaned.memberIds = validIds;
            }
          } else {
            cleaned.memberIds = validIds;
          }
        }
        return cleaned;
      })
      .filter(g => g.tasks.length > 0);

    if (cleanedGroups.length === 0) {
      setValidationError(t("settings.errorNeedTask"));
      return;
    }
    if (cleanedMembers.length === 0) {
      setValidationError(t("settings.errorNeedMember"));
      return;
    }
    onSave({
      name: editName.trim() || scheduleName,
      groups: cleanedGroups,
      members: cleanedMembers,
      rotationConfig: editRotationConfig,
      pinned,
      assignmentMode: editAssignmentMode,
      designThemeId: editDesignThemeId,
      fontId,
    });
  };

  const countLabel = (kind: "task" | "group" | "member", count: number) =>
    t(`templateSummary.${kind}.${count === 1 ? "one" : "other"}`, { count });
  const taskSummary =
    locale === "en"
      ? editAssignmentMode === "task"
        ? `${countLabel("task", editGroups.length)} · ${countLabel("member", editMembers.length)}`
        : `${countLabel("member", editMembers.length)} · ${countLabel("group", editGroups.length)}`
      : editAssignmentMode === "task"
        ? t("settings.summaryTaskMode", {
            tasks: editGroups.length,
            members: editMembers.length,
          })
        : t("settings.summaryMemberMode", {
            members: editMembers.length,
            groups: editGroups.length,
          });

  const tabsId = useId();
  const [tab, setTab] = useState<EditorTab>("content");
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const selectTab = (next: EditorTab) => {
    setTab(next);
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
  };
  const [isWide] = useState(
    () => window.matchMedia?.("(min-width: 640px)").matches ?? false
  );

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const index = EDITOR_TABS.findIndex(item => item.id === tab);
    const moveTo = (next: number) => {
      const target =
        EDITOR_TABS[(next + EDITOR_TABS.length) % EDITOR_TABS.length];
      selectTab(target.id);
      document.getElementById(`${tabsId}-${target.id}-tab`)?.focus();
    };
    if (e.key === "ArrowRight") moveTo(index + 1);
    else if (e.key === "ArrowLeft") moveTo(index - 1);
    else if (e.key === "Home") moveTo(0);
    else if (e.key === "End") moveTo(EDITOR_TABS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    // スマホは下からのシート、PC は右からのパネル。PC では当番表が左に見えたまま、見た目の変更も確かめられる
    <m.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end p-0 rotation-no-print bg-black/50 sm:bg-black/25"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <m.div
        ref={modalRef}
        className="theme-border theme-shadow w-full sm:max-w-[30rem] sheet-fixed-h sm:h-full overflow-hidden flex flex-col rounded-t-2xl sm:rounded-none"
        style={{ backgroundColor: "var(--dt-card-bg)" }}
        initial={isWide ? { x: 40 } : { y: 24 }}
        animate={{ x: 0, y: 0 }}
        exit={isWide ? { x: 40 } : { y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* ヘッダー */}
        <div
          className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4"
          style={{
            borderBottom: "var(--dt-border-width) solid var(--dt-border-color)",
          }}
        >
          <h2
            id="settings-title"
            className="text-lg font-extrabold flex items-center gap-2"
            style={{ color: "var(--dt-text)" }}
          >
            {t("settings.title")}
            {isDirty && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
              >
                {t("settings.unsaved")}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleCloseWithCheck}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
            aria-label={t("common.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* バリデーションエラー */}
        {validationError && (
          <div
            className="mx-4 sm:mx-5 mt-3 px-3 py-2 text-sm font-bold rounded-lg"
            style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
            role="alert"
          >
            {validationError}
          </div>
        )}

        {/* 項目のタブ。よく使う順に「名前と仕事」「交代のしかた」「見た目」「くわしい設定」 */}
        <div
          role="tablist"
          aria-label={t("settings.title")}
          onKeyDown={handleTabKeyDown}
          // スマホは 4 つを等分して全部見せる。PC は左から詰めて並べる
          className="shrink-0 grid grid-cols-4 sm:flex sm:gap-1 px-2 sm:px-3"
          style={{
            borderBottom: "var(--dt-border-width) solid var(--dt-border-color)",
          }}
        >
          {EDITOR_TABS.map(item => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${tabsId}-${item.id}-tab`}
                aria-selected={selected}
                aria-controls={`${tabsId}-${item.id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(item.id)}
                className="px-0.5 sm:px-3 py-3 text-[11px] min-[360px]:text-xs sm:text-sm font-bold whitespace-nowrap transition-colors -mb-px"
                style={{
                  color: selected ? "var(--dt-text)" : "var(--dt-text-muted)",
                  borderBottom: `3px solid ${selected ? "var(--dt-control-bar-bg)" : "transparent"}`,
                }}
              >
                {t(item.label)}
              </button>
            );
          })}
        </div>

        <div ref={panelScrollRef} className="flex-1 min-h-0 overflow-y-auto">
          {/* 名前と仕事 */}
          <div
            role="tabpanel"
            id={`${tabsId}-content-panel`}
            aria-labelledby={`${tabsId}-content-tab`}
            hidden={tab !== "content"}
            className="px-4 sm:px-5 py-4"
          >
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor={`${tabsId}-name`}
                  className="text-xs font-bold mb-1 block"
                  style={{ color: "var(--dt-text-muted)" }}
                >
                  {t("settings.scheduleName")}
                </label>
                <input
                  id={`${tabsId}-name`}
                  type="text"
                  value={editName}
                  onChange={e => applyEditorPatch({ name: e.target.value })}
                  maxLength={LIMITS.scheduleName}
                  className="w-full dt-field px-3 py-2 text-sm font-bold"
                  placeholder={t("settings.scheduleNamePlaceholder")}
                />
              </div>
              <p className="text-xs" style={{ color: "var(--dt-text-muted)" }}>
                {taskSummary}
              </p>
              <TaskGroupEditor
                groups={editGroups}
                members={editMembers}
                onGroupsChange={nextGroups =>
                  applyEditorPatch({ groups: nextGroups })
                }
                onMembersChange={nextMembers =>
                  applyEditorPatch({ members: nextMembers })
                }
                assignmentMode={editAssignmentMode}
              />
            </div>
          </div>

          {/* 交代のしかた */}
          <div
            role="tabpanel"
            id={`${tabsId}-rotation-panel`}
            aria-labelledby={`${tabsId}-rotation-tab`}
            hidden={tab !== "rotation"}
            className="px-4 sm:px-5 py-4"
          >
            <RotationConfigEditor
              config={editRotationConfig}
              onUpdate={updateRotationConfig}
            />
          </div>

          {/* 見た目（テーマと文字）。選ぶと後ろの当番表にもすぐ映る */}
          <div
            role="tabpanel"
            id={`${tabsId}-appearance-panel`}
            aria-labelledby={`${tabsId}-appearance-tab`}
            hidden={tab !== "appearance"}
            className="px-4 sm:px-5 py-4"
          >
            <div className="flex flex-col gap-5">
              <div>
                <h3
                  className="text-xs font-bold mb-2"
                  style={{ color: "var(--dt-text-muted)" }}
                >
                  {t("settings.sectionDesign")}
                  <span className="font-medium">
                    {t("settings.summarySeparator")}
                    {getThemeLabel(editDesignThemeId, t)}
                  </span>
                </h3>
                <DesignThemePicker
                  selectedThemeId={editDesignThemeId}
                  onSelect={handleThemePreview}
                />
              </div>
              <div>
                <h3
                  className="text-xs font-bold mb-1"
                  style={{ color: "var(--dt-text-muted)" }}
                >
                  {t("settings.sectionFont")}
                  <span className="font-medium">
                    {t("settings.summarySeparator")}
                    {t(getFontById(fontId).labelKey)}
                  </span>
                </h3>
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--dt-text-muted)" }}
                >
                  {t("font.appliesToRoster")}
                </p>
                <FontPicker
                  selectedFontId={fontId}
                  onSelect={handleFontPreview}
                />
              </div>
            </div>
          </div>

          {/* くわしい設定（割り当ての見方と、この当番表の複製・削除） */}
          <div
            role="tabpanel"
            id={`${tabsId}-advanced-panel`}
            aria-labelledby={`${tabsId}-advanced-tab`}
            hidden={tab !== "advanced"}
            className="px-4 sm:px-5 py-4 flex flex-col gap-6"
          >
            <fieldset className="border-0 p-0 m-0">
              <legend
                className="text-xs font-bold mb-1 block"
                style={{ color: "var(--dt-text-muted)" }}
              >
                {t("settings.chooseView")}
              </legend>
              <div className="flex flex-col gap-2">
                {(
                  [
                    [
                      "member",
                      "settings.whoDoesWhat",
                      "settings.whoDoesWhatDesc",
                    ],
                    ["task", "settings.whatByWhom", "settings.whatByWhomDesc"],
                  ] as const
                ).map(([mode, label, desc]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={editAssignmentMode === mode}
                    className={`${editAssignmentMode === mode ? "theme-border" : "dt-field"} w-full text-left px-3 py-2.5 transition-colors`}
                    style={{
                      borderRadius: "var(--dt-border-radius-sm)",
                      ...(editAssignmentMode === mode
                        ? { backgroundColor: "var(--dt-current-highlight)" }
                        : {}),
                    }}
                    onClick={() => handleAssignmentModeChange(mode)}
                  >
                    <span
                      className="block text-sm font-bold"
                      style={{ color: "var(--dt-text)" }}
                    >
                      {t(label)}
                    </span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: "var(--dt-text-secondary)" }}
                    >
                      {t(desc)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <section>
              <h3
                className="text-xs font-bold mb-2"
                style={{ color: "var(--dt-text-muted)" }}
              >
                {t("settings.thisRoster")}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onDuplicate()}
                  className="theme-border inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-all duration-150 theme-hover-lift"
                  style={{
                    color: "var(--dt-text)",
                    backgroundColor: "var(--dt-button-bg)",
                    borderRadius: "10px",
                  }}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {t("common.duplicate")}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-red-50"
                    style={{ color: "#DC2626", borderRadius: "10px" }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t("common.delete")}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* フッター（保存だけ。複製と削除は「くわしい設定」とタブのメニューにある） */}
        <div
          className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
          style={{
            borderTop: "var(--dt-border-width) solid var(--dt-border-color)",
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            className="theme-border theme-shadow-sm w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-all duration-150 theme-hover-lift"
            style={{
              backgroundColor: "var(--dt-control-bar-bg)",
              color: "var(--dt-control-bar-text)",
              borderRadius: "10px",
            }}
          >
            <Save className="size-4" aria-hidden="true" /> {t("common.save")}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}
