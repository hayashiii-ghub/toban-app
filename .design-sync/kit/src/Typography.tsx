import React from "react";

export interface TypeSpecimen {
  /** Weight value (400 / 700 / 800). */
  weight: number;
  /** Role label, e.g. "本文 / Normal". */
  label: string;
  /** Pixel size for the sample line. */
  size: number;
}

export interface TypographyProps {
  /** Specimens to render. Defaults to toban-app's three weights. */
  specimens?: TypeSpecimen[];
  /** Sample text shown at each weight. */
  sample?: string;
}

const DEFAULT_SPECIMENS: TypeSpecimen[] = [
  { weight: 400, label: "Normal · 本文", size: 16 },
  { weight: 700, label: "Bold · 見出し", size: 22 },
  { weight: 800, label: "Extra · 強調タイトル", size: 30 },
];

/**
 * Type scale for toban-app. The brand face is M PLUS Rounded 1c — a soft,
 * rounded gothic that carries the app's friendly tone — shown at the three
 * shipped weights with a Japanese sample.
 */
export function Typography({
  specimens = DEFAULT_SPECIMENS,
  sample = "当番表をかんたん作成",
}: TypographyProps) {
  return (
    <div style={{ fontFamily: "var(--dt-font-family)", color: "var(--dt-text)", padding: 4 }}>
      <div style={{ fontSize: 12, color: "var(--dt-text-muted)", marginBottom: 14 }}>
        M PLUS Rounded 1c
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {specimens.map((s) => (
          <div key={s.weight}>
            <div style={{ fontSize: 11, color: "var(--dt-text-secondary)", marginBottom: 2 }}>
              {s.label} · {s.weight}
            </div>
            <div style={{ fontSize: s.size, fontWeight: s.weight, lineHeight: 1.3 }}>{sample}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
