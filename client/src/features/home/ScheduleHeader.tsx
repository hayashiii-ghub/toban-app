import { m } from "framer-motion";
import { usePrintDateString } from "@/hooks/usePrintDateString";
import { useT } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface ScheduleHeaderProps {
  scheduleName: string;
  rotationLabel: string;
  /** 日付モードなら rotationLabel は「9/29(火)の当番」の形なので「順番:」を付けない */
  isDateMode?: boolean;
  localSaveStatus?: "saved" | "failed" | "pending";
}

export function ScheduleHeader({
  scheduleName,
  rotationLabel,
  isDateMode,
  localSaveStatus,
}: ScheduleHeaderProps) {
  const t = useT();
  const printDate = usePrintDateString();
  return (
    <header className="rotation-print-header pt-6 sm:pt-8 pb-3 sm:pb-6 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* スマホはページの一番下の案内が下の帯に隠れるので、言語の切り替えだけをここに出す
            （ほかの案内は編集画面の「くわしい設定」にある） */}
        <div className="absolute -right-1 -top-0.5 sm:hidden rotation-no-print">
          <LanguageSwitcher
            iconOnly
            className="size-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/5 text-[var(--dt-text-secondary)]"
          />
        </div>
        <m.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl sm:text-3xl md:text-4xl tracking-tight rotation-no-print [overflow-wrap:anywhere] max-sm:px-9"
            style={{
              color: "var(--dt-text)",
              fontWeight: "var(--dt-font-weight-extra)",
            }}
          >
            {scheduleName}
          </h1>
          {localSaveStatus === "failed" && (
            <div
              className="rotation-no-print mt-3 space-y-1 text-xs sm:text-sm [overflow-wrap:anywhere]"
              style={{ color: "var(--dt-text-secondary)" }}
            >
              <p role="alert" className="font-bold text-red-700">
                {t("summary.saveFailed")}
              </p>
            </div>
          )}
          <div
            className="rotation-print-only text-2xl sm:text-3xl md:text-4xl tracking-tight"
            style={{
              color: "var(--dt-text)",
              fontWeight: "var(--dt-font-weight-extra)",
            }}
            aria-hidden="true"
          >
            {scheduleName}
          </div>

          <div
            className="rotation-print-only mt-3 pt-2 text-sm font-bold"
            style={{
              color: "var(--dt-text-secondary)",
              borderBottom: "3px solid var(--dt-border-color)",
            }}
          >
            <span className="inline-block pb-2">
              {t(isDateMode ? "shared.printHeaderDate" : "shared.printHeader", {
                label: rotationLabel,
                date: printDate,
              })}
            </span>
          </div>
        </m.div>
      </div>
    </header>
  );
}
