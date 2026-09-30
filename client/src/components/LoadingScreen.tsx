import { Loader2 } from "lucide-react";
import { useT } from "@/i18n";

/** 画面を読み込んでいる間の表示（遅い回線でも止まって見えないよう、言葉も添える） */
export function LoadingScreen() {
  const t = useT();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: "var(--dt-page-bg)" }}
      role="status"
    >
      <Loader2
        className="size-8 animate-spin"
        style={{ color: "var(--dt-current-highlight)" }}
        aria-hidden="true"
      />
      <span className="text-sm" style={{ color: "var(--dt-text-muted)" }}>
        {t("common.loading")}
      </span>
    </div>
  );
}
