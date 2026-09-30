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

// 印刷・共有・編集のボタン。スマホの下の帯ではアイコンの下に文字を置いて幅を詰める
const ACTION_CLASS =
  "theme-border theme-shadow-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 min-w-[3.25rem] px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-[11px] sm:text-sm leading-tight transition-all duration-150 theme-hover-lift active:translate-x-[1px] active:translate-y-[1px]";

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
    // スマホは Home の .home-bottom-panel で画面の下に固定される（親指の届く位置）。
    // PC はタイトルの下にヘッダーとして置く
    <div className="rotation-no-print sm:px-4 sm:pb-3">
      <div className="sm:max-w-4xl sm:mx-auto">
        <m.div
          className="theme-border theme-shadow max-sm:border-x-0 max-sm:border-b-0 sm:rounded-[var(--dt-border-radius)] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2"
          style={{ backgroundColor: "var(--dt-control-bar-bg)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div
            className="flex items-center gap-2.5 min-w-0"
            data-onboarding="rotation-controls"
          >
            {isDateMode ? (
              // 手で送るときの「初期」と同じ白い箱に入れる。帯の色の上に直接書くと、テーマによって読みにくい
              <div
                className="theme-border flex items-center gap-2 min-h-9 sm:min-h-10 px-2.5 py-1 min-w-0"
                style={{
                  backgroundColor: "var(--dt-button-bg)",
                  borderRadius: "var(--dt-border-radius-sm)",
                }}
              >
                <CalendarDays
                  className="size-4 shrink-0"
                  style={{ color: "var(--dt-text-secondary)" }}
                  aria-hidden="true"
                />
                <div className="min-w-0 leading-tight">
                  <div
                    className="text-[13px] sm:text-base font-bold whitespace-nowrap"
                    style={{ color: "var(--dt-text)" }}
                  >
                    {rotationLabel}
                  </div>
                  {dateDetail && (
                    <div
                      className="text-[11px] sm:text-xs mt-0.5"
                      style={{ color: "var(--dt-text-secondary)" }}
                    >
                      {dateDetail}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
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
            <PrintMenu onPrint={onPrint} className={ACTION_CLASS} />
            <button
              type="button"
              onClick={onShare}
              disabled={isSharing}
              data-onboarding="share-button"
              className={`${ACTION_CLASS} disabled:opacity-50`}
              style={{
                backgroundColor: "var(--dt-button-bg)",
                borderRadius: "var(--dt-border-radius-sm)",
              }}
              aria-label={t("rotation.shareAria")}
            >
              {isSharing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : syncStatus === "error" ? (
                <CloudOff
                  className="size-4"
                  style={{ color: "#EF4444" }}
                  aria-label={t("rotation.syncError")}
                />
              ) : (
                <Share2 className="size-4" aria-hidden="true" />
              )}
              {t("common.share")}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              data-onboarding="edit-button"
              className={ACTION_CLASS}
              style={{
                backgroundColor: "var(--dt-button-bg)",
                borderRadius: "var(--dt-border-radius-sm)",
              }}
              aria-label={t("rotation.editAria")}
            >
              <Pencil className="size-4" aria-hidden="true" />
              {t("common.edit")}
            </button>
          </div>
        </m.div>
      </div>
    </div>
  );
}
