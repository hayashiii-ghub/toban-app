import { Printer } from "lucide-react";

interface PrintMenuProps {
  onPrint: () => void;
}

export function PrintMenu({ onPrint }: PrintMenuProps) {
  return (
    <button type="button"
      onClick={onPrint}
      data-onboarding="print-button"
      className="theme-border theme-shadow-sm flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 font-bold text-sm transition-all duration-150 theme-hover-lift active:translate-x-[1px] active:translate-y-[1px] rotation-no-print"
      style={{ backgroundColor: "var(--dt-button-bg)", borderRadius: "var(--dt-border-radius-sm)" }}
      aria-label="印刷する"
    >
      <Printer className="size-3.5 sm:size-4" aria-hidden="true" />
      印刷
    </button>
  );
}
