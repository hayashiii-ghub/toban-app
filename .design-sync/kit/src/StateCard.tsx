import React from "react";
import { Button } from "./Button";

export interface StateCardProps {
  /** `notFound` = neutral 🔍 (not the user's fault); `error` = amber caution. */
  variant: "notFound" | "error";
  /** Heading. */
  title: string;
  /** Supporting line. */
  message: string;
  /** Override the default glyph. */
  glyph?: string;
  /** Primary action label (e.g. "ホームに戻る"). */
  actionLabel?: string;
}

/**
 * Full-screen state card for empty / error pages. `notFound` uses a neutral
 * highlight circle with 🔍 — a missing page is not a user error, so no warning
 * color. `error` uses an amber caution badge (red stays destructive-only).
 */
export function StateCard({ variant, title, message, glyph, actionLabel = "ホームに戻る" }: StateCardProps) {
  const isError = variant === "error";
  const badgeBg = isError ? "var(--dt-warning-bg)" : "var(--dt-current-highlight)";
  const defaultGlyph = isError ? "⚠️" : "🔍";
  return (
    <div
      className="theme-border theme-shadow"
      style={{
        fontFamily: "var(--dt-font-family)",
        color: "var(--dt-text)",
        background: "var(--dt-card-bg)",
        width: 420,
        maxWidth: "100%",
        borderRadius: "var(--dt-border-radius)",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div
        className="theme-border"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 28,
        }}
      >
        <span aria-hidden="true">{glyph ?? defaultGlyph}</span>
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>{title}</h2>
      <p style={{ margin: "0 0 26px", fontSize: 14, color: "var(--dt-text-secondary)", lineHeight: 1.6 }}>
        {message}
      </p>
      <Button variant="primary">{actionLabel}</Button>
    </div>
  );
}
