import { useMemo } from "react";
import { useDateLocale } from "@/i18n";
import { useLocalToday } from "@/hooks/useLocalToday";

// 印刷日表示用の日付文字列。
export function usePrintDateString(): string {
  const dateLocale = useDateLocale();
  const today = useLocalToday();
  return useMemo(
    () =>
      today.toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    [dateLocale, today]
  );
}
