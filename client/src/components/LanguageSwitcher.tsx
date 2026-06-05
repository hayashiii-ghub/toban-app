import { Languages } from "lucide-react";
import { useLocale, useT } from "@/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

const DEFAULT_CLASS =
  "flex items-center gap-1 px-2 h-8 rounded-full text-sm text-muted-foreground/60 hover:text-muted-foreground/80 hover:bg-muted/40 transition-colors";

// JA ⇄ EN のトグル。2 言語なので dropdown ではなく「切り替え先を表示するボタン」。
export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  const next = locale === "ja" ? "en" : "ja";
  const nextLabel = t(next === "ja" ? "lang.ja" : "lang.en");

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("lang.switchLabel")}
      title={t("lang.switchLabel")}
      className={className ?? DEFAULT_CLASS}
    >
      <Languages className="size-4" aria-hidden="true" />
      <span className="font-medium">{nextLabel}</span>
    </button>
  );
}
