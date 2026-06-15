import React from "react";

export interface ThemeSwatch {
  /** Stable theme id. */
  id: string;
  /** Display name (Japanese). */
  name: string;
  /** Primary accent (control bar / active tab). */
  primary: string;
  /** Secondary / soft accent. */
  secondary: string;
  /** Page background. */
  bg: string;
}

export interface ThemeSwatchesProps {
  /** Themes to render. Defaults to toban-app's nine named themes. */
  themes?: ThemeSwatch[];
  /** Optional heading. */
  title?: string;
}

const DEFAULT_THEMES: ThemeSwatch[] = [
  { id: "whiteboard", name: "ホワイトボード", primary: "#666666", secondary: "#f5f5f5", bg: "#ffffff" },
  { id: "chalkboard", name: "こくばん", primary: "#2E6B4F", secondary: "#EDE8DF", bg: "#F5F0E8" },
  { id: "crayon", name: "クレヨン", primary: "#E86830", secondary: "#FFE4CC", bg: "#FFF6EC" },
  { id: "sunflower", name: "ひまわり", primary: "#F0A830", secondary: "#FFF4D8", bg: "#FFFCF0" },
  { id: "lavender", name: "ラベンダー", primary: "#9B85CC", secondary: "#EDE6F8", bg: "#F8F5FC" },
  { id: "sakura", name: "さくら", primary: "#F9A8B8", secondary: "#FFF0F3", bg: "#FFF5F7" },
  { id: "nature", name: "わかば", primary: "#6B9E6B", secondary: "#E8F0E4", bg: "#F5F7F2" },
  { id: "ocean", name: "うみ", primary: "#50B0E0", secondary: "#E0F2FC", bg: "#F0F8FE" },
  { id: "nightsky", name: "よぞら", primary: "#2C4466", secondary: "#DEE4EE", bg: "#F0F2F6" },
];

/**
 * The nine selectable themes in toban-app. Each card previews a theme's page
 * background, primary accent and soft accent so a redesign can stay within
 * the existing palette set rather than introducing new ones.
 */
export function ThemeSwatches({ themes = DEFAULT_THEMES, title = "テーマ（9種）" }: ThemeSwatchesProps) {
  return (
    <div style={{ fontFamily: "var(--dt-font-family)", color: "var(--dt-text)", padding: 4 }}>
      {title ? (
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800 }}>{title}</h3>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {themes.map((t) => (
          <div
            key={t.id}
            className="theme-border theme-radius theme-shadow-sm"
            style={{ overflow: "hidden", background: t.bg }}
          >
            <div style={{ height: 44, background: t.primary, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: t.secondary,
                  border: "1.5px solid rgba(255,255,255,0.7)",
                }}
              />
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                {[t.primary, t.secondary, t.bg].map((c) => (
                  <span
                    key={c}
                    title={c}
                    style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid rgba(0,0,0,0.12)" }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
