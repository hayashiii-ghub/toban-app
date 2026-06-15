import React from "react";

export interface ColorToken {
  /** CSS custom property name, e.g. "--dt-text". */
  name: string;
  /** Resolved hex value. */
  value: string;
  /** Short Japanese role label shown under the swatch. */
  role?: string;
}

export interface ColorTokensProps {
  /** Tokens to render. Defaults to toban-app's core --dt-* palette. */
  tokens?: ColorToken[];
  /** Optional heading above the swatch grid. */
  title?: string;
}

const DEFAULT_TOKENS: ColorToken[] = [
  { name: "--dt-page-bg", value: "#ffffff", role: "ページ背景" },
  { name: "--dt-card-bg", value: "#ffffff", role: "カード背景" },
  { name: "--dt-text", value: "#1a1a1a", role: "本文" },
  { name: "--dt-text-secondary", value: "#666666", role: "副次テキスト" },
  { name: "--dt-text-muted", value: "#888888", role: "弱いテキスト" },
  { name: "--dt-border-color", value: "#b8b8b8", role: "境界線" },
  { name: "--dt-current-highlight", value: "#e0e0e0", role: "現在ハイライト" },
  { name: "--dt-table-border-strong", value: "#888888", role: "表の強い線" },
  { name: "--dt-control-bar-bg", value: "#f0f0f0", role: "操作バー" },
  { name: "--dt-destructive", value: "#DC2626", role: "破壊操作（赤）" },
  { name: "--dt-warning-fg", value: "#D97706", role: "注意（アンバー）" },
];

/**
 * Color token palette for toban-app. Renders every core `--dt-*` swatch with
 * its role and hex value, so the design agent picks from the real palette
 * instead of inventing colors. Red is reserved for destructive actions only.
 */
export function ColorTokens({ tokens = DEFAULT_TOKENS, title = "カラートークン" }: ColorTokensProps) {
  return (
    <div style={{ fontFamily: "var(--dt-font-family)", color: "var(--dt-text)", padding: 4 }}>
      {title ? (
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800 }}>{title}</h3>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
          gap: 12,
        }}
      >
        {tokens.map((t) => (
          <div
            key={t.name}
            className="theme-border theme-radius-sm theme-shadow-sm"
            style={{ overflow: "hidden", background: "var(--dt-card-bg)" }}
          >
            <div style={{ height: 52, background: t.value }} />
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t.role ?? t.name}</div>
              <div style={{ fontSize: 11, color: "var(--dt-text-muted)", fontFamily: "monospace" }}>
                {t.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
