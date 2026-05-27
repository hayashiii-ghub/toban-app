import { m } from "framer-motion";

interface ScheduleHeaderProps {
  scheduleName: string;
  rotationLabel: string;
}

export function ScheduleHeader({
  scheduleName,
  rotationLabel,
}: ScheduleHeaderProps) {
  return (
    <header className="rotation-print-header pt-6 sm:pt-8 pb-6 sm:pb-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto text-center">
        <m.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl sm:text-3xl md:text-4xl tracking-tight rotation-no-print"
            style={{ color: "var(--dt-text)", fontWeight: "var(--dt-font-weight-extra)" }}
          >
            {scheduleName}
          </h1>
          <div
            className="rotation-print-only text-2xl sm:text-3xl md:text-4xl tracking-tight"
            style={{ color: "var(--dt-text)", fontWeight: "var(--dt-font-weight-extra)" }}
            aria-hidden="true"
          >
            {scheduleName}
          </div>

          <div
            className="rotation-print-only mt-3 pt-2 text-sm font-bold"
            style={{ color: "var(--dt-text-secondary)", borderBottom: "2px solid var(--dt-current-highlight)" }}
          >
            <span className="inline-block pb-2">
              順番: {rotationLabel} ／ 印刷日: {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </span>
          </div>
        </m.div>
      </div>
    </header>
  );
}
