import type { RotationConfig } from "@/rotation/types";

interface Props {
  config: RotationConfig;
  onUpdate: (updater: (prev: RotationConfig) => RotationConfig) => void;
}

export function RotationConfigEditor({ config, onUpdate }: Props) {
  return (
    <div>
      <label className="text-xs font-bold mb-1 block" style={{ color: "var(--dt-text-muted)" }}>交代のしかた</label>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          className="settings-option-control flex-1 theme-border transition-colors"
          style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: config.mode === "manual" ? "var(--dt-current-highlight)" : "#FAFAFA" }}
          onClick={() => onUpdate((prev) => ({ ...prev, mode: "manual" }))}
        >
          手動で切り替え
        </button>
        <button
          type="button"
          className="settings-option-control flex-1 theme-border transition-colors"
          style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: config.mode === "date" ? "var(--dt-current-highlight)" : "#FAFAFA" }}
          onClick={() => onUpdate((prev) => ({
            ...prev,
            mode: "date",
            startDate: prev.startDate || new Date().toISOString().split("T")[0],
            cycleDays: prev.cycleDays || 7,
          }))}
        >
          日付で自動切り替え
        </button>
      </div>

      {config.mode === "date" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--dt-text-muted)" }}>開始日</label>
              <div className="settings-input-control settings-input-shell theme-border" style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#FAFAFA" }}>
                <input
                  type="date"
                  value={config.startDate || ""}
                  onChange={(e) => onUpdate((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="settings-date-input w-full"
                  aria-label="開始日"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="text-xs font-bold block mb-1" style={{ color: "var(--dt-text-muted)" }}>何日ごとに交代？</label>
              <div className="settings-input-control settings-input-shell theme-border justify-center" style={{ borderRadius: "var(--dt-border-radius-sm)", backgroundColor: "#FAFAFA" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={config.cycleDays || 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v > 0 && v <= 365) onUpdate((prev) => ({ ...prev, cycleDays: v }));
                  }}
                  className="settings-number-input w-10 bg-transparent text-center outline-none"
                />
                <span className="shrink-0" style={{ color: "var(--dt-text-muted)" }}>日ごと</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            <label className="inline-flex items-center gap-2 cursor-pointer pr-2">
              <input
                type="checkbox"
                checked={config.skipSaturday ?? false}
                onChange={(e) => onUpdate((prev) => ({ ...prev, skipSaturday: e.target.checked }))}
                className="size-4 accent-amber-500"
              />
              <span className="text-xs font-bold" style={{ color: "var(--dt-text-secondary)" }}>土曜はお休み</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer pr-2">
              <input
                type="checkbox"
                checked={config.skipSunday ?? false}
                onChange={(e) => onUpdate((prev) => ({ ...prev, skipSunday: e.target.checked }))}
                className="size-4 accent-amber-500"
              />
              <span className="text-xs font-bold" style={{ color: "var(--dt-text-secondary)" }}>日曜はお休み</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer pr-2">
              <input
                type="checkbox"
                checked={config.skipHolidays ?? false}
                onChange={(e) => onUpdate((prev) => ({ ...prev, skipHolidays: e.target.checked }))}
                className="size-4 accent-amber-500"
              />
              <span className="text-xs font-bold" style={{ color: "var(--dt-text-secondary)" }}>祝日はお休み</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
