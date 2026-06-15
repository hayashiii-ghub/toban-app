import React from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps {
  /** Label / content. */
  children: React.ReactNode;
  /** Visual role. `destructive` is the only red-filled variant. */
  variant?: ButtonVariant;
  /** Optional leading glyph (emoji or icon node). */
  icon?: React.ReactNode;
  /** Native button type. */
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

function styleFor(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return { background: "#1a1a1a", color: "#ffffff", border: "1px solid #1a1a1a" };
    case "destructive":
      return { background: "var(--dt-destructive)", color: "#ffffff", border: "1px solid var(--dt-destructive)" };
    case "secondary":
    default:
      return { background: "var(--dt-card-bg)", color: "var(--dt-text)", border: "var(--dt-border-width) solid var(--dt-border-color)" };
  }
}

/**
 * Buttons for toban-app. Three roles only: `primary` (near-black, the main
 * action), `secondary` (outlined, neutral) and `destructive` (red — reserved
 * exclusively for delete/irreversible actions). All share a 10px radius.
 */
export function Button({ children, variant = "primary", icon, type = "button", disabled, onClick }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="theme-shadow-sm theme-hover-lift"
      style={{
        ...styleFor(variant),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 10,
        fontFamily: "var(--dt-font-family)",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? <span aria-hidden="true" style={{ display: "inline-flex" }}>{icon}</span> : null}
      {children}
    </button>
  );
}
