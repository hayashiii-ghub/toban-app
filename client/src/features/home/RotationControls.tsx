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
    // スマホは画面の下に固定（親指の届く位置）、PC はタイトルの下にヘッダーとして置く。
    // 下に固定するほかの要素は home.css の --home-toolbar-space の分だけ持ち上げる
    <div
      data-home-toolbar
      className="rotation-no-print fixed inset-x-0 bottom-0 z-40 sm:static sm:z-auto sm:px-4 sm:pb-3"
    >
      <div className="sm:max-w-4xl sm:mx-auto">
        <m.div
          className="theme-border theme-shadow max-sm:border-x-0 max-sm:border-b-0 max-sm:shadow-[0_-6px_20px_rgba(0,0,0,0.12)] sm:rounded-[var(--dt-border-radius)] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2"
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
              <>
                <CalendarDays
                  className="size-5 shrink-0 hidden sm:block"
                  style={{ color: "var(--dt-control-bar-text)" }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div
                    className="text-xs sm:text-base font-bold leading-tight"
                    style={{ color: "var(--dt-control-bar-text)" }}
                  >
                    {rotationLabel}
                  </div>
                  {dateDetail && (
                    <div
                      className="text-[11px] sm:text-xs mt-0.5"
                      style={{ color: "var(--dt-control-bar-subtext)" }}
                    >
                      {dateDetail}
                    </div>
                  )}
                </div>
              </>
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
                    className="h-9 sm:h-10 min-w-[2.25rem] sm:min-w-[2.5rem] flex items-center justify-center px-1 text-base sm:text-lg"
                    style={{
                      fontWeight: "var(--dt-font-weight-extra)",
                      borderLeft:
                        "var(--dt-border-width) solid var(--dt-border-color)",
                      borderRight:
                        "var(--dt-border-width) solid var(--dt-border-color)",
                    }}
                    aria-label={t("rotation.currentAria", { n: rotation })}
                  >
                    {rotation}
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
                {/* 幅 360px 未満（iPhone SE 初代など）は下の帯に収まらないので出さない */}
                <div className="hidden min-[360px]:block leading-tight">
                  <div
                    className="text-[11px] sm:text-sm font-bold"
                    style={{ color: "var(--dt-control-bar-text)" }}
                  >
                    {t("rotation.current")}
                  </div>
                  <div
                    className="text-xs sm:text-sm font-medium mt-0.5"
                    style={{ color: "var(--dt-control-bar-subtext)" }}
                  >
                    {rotationLabel}
                  </div>
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
