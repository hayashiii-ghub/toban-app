import { m } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Loader2,
  Pencil,
  Share2,
} from "lucide-react";
import type { SyncStatus } from "@/lib/syncManager";
import { PrintMenu } from "@/components/PrintMenu";
import { useT } from "@/i18n";

interface RotationControlsProps {
  rotation: number;
  rotationLabel: string;
  isSharing: boolean;
  isDateMode?: boolean;
  /** 日付モードの交代の間隔（「7日ごとに交代」） */
  dateDetail?: string;
  isAnimating?: boolean;
  syncStatus?: SyncStatus;
  onPrint: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
  onRotateForward?: () => void;
  onRotateBackward?: () => void;
}

export function RotationControls({
  rotation,
  rotationLabel,
  isSharing,
  isDateMode,
  dateDetail,
  isAnimating,
  syncStatus,
  onPrint,
  onOpenSettings,
  onShare,
  onRotateForward,
  onRotateBackward,
}: RotationControlsProps) {
  const t = useT();
  return (
    <div className="px-3 sm:px-4 pb-3 rotation-no-print">
      <div className="max-w-4xl mx-auto">
        <m.div
          className="theme-border theme-shadow px-2.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5"
          style={{
            backgroundColor: "var(--dt-control-bar-bg)",
            borderRadius: "var(--dt-border-radius)",
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div
            className="flex items-center gap-2.5 min-w-0"
            data-onboarding="rotation-controls"
          >
            {isDateMode ? (
              <>
                <CalendarDays
                  className="size-5 shrink-0"
                  style={{ color: "var(--dt-control-bar-text)" }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div
                    className="text-sm sm:text-base font-bold"
                    style={{ color: "var(--dt-control-bar-text)" }}
                  >
                    {rotationLabel}
                  </div>
                  {dateDetail && (
                    <div
                      className="text-xs"
                      style={{ color: "var(--dt-control-bar-subtext)" }}
                    >
                      {dateDetail}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span
                  className="text-xs font-bold hidden sm:inline"
                  style={{ color: "var(--dt-control-bar-subtext)" }}
                >
                  {t("rotation.current")}
                </span>
                <div
                  className="theme-border flex items-center overflow-hidden"
                  style={{
                    backgroundColor: "var(--dt-button-bg)",
                    borderRadius: "var(--dt-border-radius-sm)",
                  }}
                >
                  {onRotateBackward && (
                    <button
                      type="button"
                      onClick={onRotateBackward}
                      disabled={isAnimating}
                      className="h-9 sm:h-10 px-1.5 sm:px-2 flex items-center justify-center transition-colors hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
                      aria-label={t("rotation.prevAria")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  )}
                  <div
                    className="h-9 sm:h-10 min-w-[3rem] sm:min-w-[4.5rem] flex items-center justify-center px-1.5 sm:px-3 text-sm sm:text-base whitespace-nowrap"
                    style={{
                      fontWeight: "var(--dt-font-weight-extra)",
                      borderLeft:
                        "var(--dt-border-width) solid var(--dt-border-color)",
                      borderRight:
                        "var(--dt-border-width) solid var(--dt-border-color)",
                    }}
                    aria-label={t("rotation.currentAria", { n: rotation })}
                  >
                    {rotationLabel}
                  </div>
                  {onRotateForward && (
                    <button
                      type="button"
                      onClick={onRotateForward}
                      disabled={isAnimating}
                      className="h-9 sm:h-10 px-1.5 sm:px-2 flex items-center justify-center transition-colors hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
                      aria-label={t("rotation.nextAria")}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <PrintMenu onPrint={onPrint} />
            <button
              type="button"
              onClick={onShare}
              disabled={isSharing}
              data-onboarding="share-button"
              className="theme-border theme-shadow-sm flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 font-bold text-sm transition-all duration-150 theme-hover-lift active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              style={{
                backgroundColor: "var(--dt-button-bg)",
                borderRadius: "var(--dt-border-radius-sm)",
              }}
              aria-label={t("rotation.shareAria")}
            >
              {isSharing ? (
                <Loader2
                  className="size-3.5 sm:size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : syncStatus === "error" ? (
                <CloudOff
                  className="size-3.5 sm:size-4"
                  style={{ color: "#EF4444" }}
                  aria-label={t("rotation.syncError")}
                />
              ) : (
                <Share2 className="size-3.5 sm:size-4" aria-hidden="true" />
              )}
              {t("common.share")}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              data-onboarding="edit-button"
              className="theme-border theme-shadow-sm flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 font-bold text-sm transition-all duration-150 theme-hover-lift active:translate-x-[1px] active:translate-y-[1px]"
              style={{
                backgroundColor: "var(--dt-button-bg)",
                borderRadius: "var(--dt-border-radius-sm)",
              }}
              aria-label={t("rotation.editAria")}
            >
              <Pencil className="size-3.5 sm:size-4" aria-hidden="true" />{" "}
              {t("common.edit")}
            </button>
          </div>
        </m.div>
      </div>
    </div>
  );
}
