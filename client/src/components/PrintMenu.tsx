import { Printer } from "lucide-react";
import { useT } from "@/i18n";

const DEFAULT_CLASS =
  "theme-border theme-shadow-sm flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 font-bold text-sm transition-all duration-150 theme-hover-lift active:translate-x-[1px] active:translate-y-[1px] rotation-no-print";

interface PrintMenuProps {
  onPrint: () => void;
  /** ホームの操作の帯は、スマホで文字をアイコンの下に置くので形を差し替える */
  className?: string;
}

export function PrintMenu({
  onPrint,
  className = DEFAULT_CLASS,
}: PrintMenuProps) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onPrint}
      data-onboarding="print-button"
      className={className}
      style={{
        backgroundColor: "var(--dt-button-bg)",
        borderRadius: "var(--dt-border-radius-sm)",
      }}
      aria-label={t("print.printAria")}
    >
      <Printer className="size-4" aria-hidden="true" />
      {t("print.print")}
    </button>
  );
}
