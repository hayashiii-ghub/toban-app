import { startTransition, useCallback, useMemo, useState } from "react";
import type { AppState, AssignmentMode, Member, RotationConfig, Schedule, ScheduleTemplate, TaskGroup } from "@/rotation/types";

/**
 * handleSaveSettings の保存ペイロード。partial merge ではなく設定全体の置換
 * （optional フィールドは未指定なら undefined で上書きされる）。
 */
export interface ScheduleSettings {
  name: string;
  groups: TaskGroup[];
  members: Member[];
  rotationConfig?: RotationConfig;
  pinned?: boolean;
  assignmentMode?: AssignmentMode;
  designThemeId?: string;
}
import { createScheduleFromTemplate, deepClone, generateId, loadState, normalizeRotation, saveState } from "@/rotation/utils";
import { deleteSchedule } from "@/lib/api";
import { useT } from "@/i18n";
import { toast } from "sonner";

export function useScheduleManager() {
  const t = useT();
  const [state, setState] = useState<AppState>(loadState);

  const activeSchedule = useMemo(() => {
    return state.schedules.find((schedule) => schedule.id === state.activeScheduleId) ?? state.schedules[0] ?? undefined;
  }, [state.activeScheduleId, state.schedules]);

  const updateActiveSchedule = useCallback((updater: (schedule: Schedule) => Schedule) => {
    startTransition(() => {
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((schedule) =>
          schedule.id === prev.activeScheduleId ? updater(schedule) : schedule,
        ),
      }));
    });
  }, []);

  const handleAddSchedule = useCallback((template: ScheduleTemplate) => {
    const newSchedule = createScheduleFromTemplate(template);
    startTransition(() => {
      setState((prev) => ({
        schedules: [...prev.schedules, newSchedule],
        activeScheduleId: newSchedule.id,
      }));
    });
    return newSchedule;
  }, []);

  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    // API呼び出しはsetState外で行う（state updaterは複数回呼ばれる可能性があるため）
    const schedule = state.schedules.find((s) => s.id === scheduleId);
    if (state.schedules.length <= 1) return;

    if (schedule?.slug && schedule?.editToken) {
      deleteSchedule(schedule.slug, schedule.editToken).catch((error) => {
        console.error("Failed to delete schedule from server:", error);
        toast.error(t("schedule.deleteFailed"));
      });
    }

    startTransition(() => {
      setState((prev) => {
        const remainingSchedules = prev.schedules.filter((s) => s.id !== scheduleId);
        if (remainingSchedules.length === 0) return prev;
        return {
          schedules: remainingSchedules,
          activeScheduleId: prev.activeScheduleId === scheduleId
            ? remainingSchedules[0].id
            : prev.activeScheduleId,
        };
      });
    });
  }, [state.schedules, t]);

  const handleDuplicateSchedule = useCallback(() => {
    if (!activeSchedule) return;
    const clone: Schedule = {
      id: generateId("s"),
      name: t("schedule.copyName", { name: activeSchedule.name }),
      rotation: 0,
      groups: deepClone(activeSchedule.groups),
      members: deepClone(activeSchedule.members),
      rotationConfig: activeSchedule.rotationConfig ? deepClone(activeSchedule.rotationConfig) : undefined,
      assignmentMode: activeSchedule.assignmentMode,
      designThemeId: activeSchedule.designThemeId,
    };
    startTransition(() => {
      setState((prev) => ({
        schedules: [...prev.schedules, clone],
        activeScheduleId: clone.id,
      }));
    });
  }, [activeSchedule, t]);

  const handleSaveSettings = useCallback((settings: ScheduleSettings) => {
    const { name, groups, members, rotationConfig, pinned, assignmentMode, designThemeId } = settings;
    updateActiveSchedule((schedule) => ({
      ...schedule,
      name,
      groups,
      members,
      rotation: normalizeRotation(schedule.rotation, members.filter(m => !m.skipped).length || members.length),
      rotationConfig: rotationConfig ?? schedule.rotationConfig,
      pinned,
      assignmentMode,
      designThemeId,
    }));
  }, [updateActiveSchedule]);

  const selectSchedule = useCallback((scheduleId: string) => {
    startTransition(() => {
      setState((prev) => ({ ...prev, activeScheduleId: scheduleId }));
    });
  }, []);

  const handleTabDrop = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    startTransition(() => {
      setState((prev) => {
        const schedules = [...prev.schedules];
        const fromIndex = schedules.findIndex((schedule) => schedule.id === draggedId);
        const toIndex = schedules.findIndex((schedule) => schedule.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        if ((schedules[fromIndex].pinned ?? false) !== (schedules[toIndex].pinned ?? false)) {
          return prev;
        }
        const [movedSchedule] = schedules.splice(fromIndex, 1);
        schedules.splice(toIndex, 0, movedSchedule);
        return { ...prev, schedules };
      });
    });
  }, []);

  const addScheduleFromTemplateIndex = useCallback((idx: number, templates: ScheduleTemplate[]) => {
    if (idx < 0 || idx >= templates.length) return false;
    const newSchedule = createScheduleFromTemplate(templates[idx]);
    setState((prev) => ({
      schedules: [...prev.schedules, newSchedule],
      activeScheduleId: newSchedule.id,
    }));
    return true;
  }, []);

  return {
    state,
    setState,
    activeSchedule,
    updateActiveSchedule,
    handleAddSchedule,
    handleDeleteSchedule,
    handleDuplicateSchedule,
    handleSaveSettings,
    selectSchedule,
    handleTabDrop,
    addScheduleFromTemplateIndex,
    saveState,
  };
}
