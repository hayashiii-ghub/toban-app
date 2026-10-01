import { useCallback, useMemo, useState } from "react";
import type { ScheduleSettings } from "@/hooks/useScheduleManager";
import type { RotationConfig } from "@/rotation/types";
import { getSavedFontId } from "@/fonts";
import {
  changeDraftAssignmentMode,
  createSettingsDraft,
  type SettingsDraft,
} from "./settingsDraft";

export function useSettingsDraft(settings: ScheduleSettings) {
  const [initial] = useState(() =>
    createSettingsDraft(settings, getSavedFontId())
  );
  const [draft, setDraft] = useState(initial);
  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== initialJson,
    [draft, initialJson]
  );

  // 人と仕事の変更が同じ操作で続いても、最新の下書きへ両方を適用する。
  const applyPatch = useCallback((patch: Partial<SettingsDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
  }, []);
  const updateRotationConfig = useCallback(
    (updater: (current: RotationConfig) => RotationConfig) => {
      setDraft(current => ({
        ...current,
        rotationConfig: updater(current.rotationConfig),
      }));
    },
    []
  );
  const changeAssignmentMode = useCallback(
    (mode: SettingsDraft["assignmentMode"], newTaskName: string) => {
      setDraft(current =>
        changeDraftAssignmentMode(current, mode, newTaskName)
      );
    },
    []
  );

  return {
    draft,
    initial,
    isDirty,
    applyPatch,
    updateRotationConfig,
    changeAssignmentMode,
  };
}
