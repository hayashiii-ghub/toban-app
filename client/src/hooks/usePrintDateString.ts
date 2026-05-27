import { useEffect, useState } from "react";

// 印刷日表示用の日付文字列。
// CSR-only だが react-doctor/rendering-hydration-mismatch-time を満たすため
// マウント後に評価する。
export function usePrintDateString(): string {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    );
  }, []);
  return dateStr;
}
