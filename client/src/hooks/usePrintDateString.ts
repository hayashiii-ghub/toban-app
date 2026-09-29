import { useMemo } from "react";
import { useDateLocale } from "@/i18n";

// 印刷日表示用の日付文字列。
export function usePrintDateString(): string {
  const dateLocale = useDateLocale();
  return useMemo(
    () =>
      new Date().toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    [dateLocale]
  );
}
