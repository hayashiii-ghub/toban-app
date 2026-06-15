import React from "react";
import { Button } from "./Button";

export interface ModalProps {
  /** Header title. */
  title: string;
  /** Body text (use instead of, or alongside, children). */
  message?: string;
  /** Rich body content. */
  children?: React.ReactNode;
  /** `destructive` shows a 🗑 glyph and a red confirm button. */
  variant?: "default" | "destructive";
  /** Confirm button label. */
  confirmLabel?: string;
  /** Cancel button label. */
  cancelLabel?: string;
}

/**
 * The modal panel used across toban-app (share / settings / new-schedule /
 * delete confirmation). On mobile it docks as a bottom sheet; the panel keeps
 * a header row (optional glyph + title + divider), a body, and a right-aligned
 * cancel/confirm footer. The `destructive` variant is for delete confirmation.
 */
export function Modal({
  title,
  message,
  children,
  variant = "default",
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
}: ModalProps) {
  const destructive = variant === "destructive";
  return (
    <div
      className="theme-border theme-shadow"
      style={{
        fontFamily: "var(--dt-font-family)",
        color: "var(--dt-text)",
        background: "var(--dt-card-bg)",
        width: 420,
        maxWidth: "100%",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          borderBottom: "var(--dt-border-width) solid var(--dt-border-color)",
        }}
      >
        {destructive ? (
          <span aria-hidden="true" style={{ fontSize: 18, color: "var(--dt-destructive)" }}>🗑</span>
        ) : null}
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ padding: "16px 18px" }}>
        {message ? (
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--dt-text-secondary)", lineHeight: 1.6 }}>
            {message}
          </p>
        ) : null}
        {children}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button variant="secondary">{cancelLabel}</Button>
          <Button variant={destructive ? "destructive" : "primary"}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
