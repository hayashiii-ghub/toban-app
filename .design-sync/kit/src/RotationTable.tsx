import React from "react";

export interface RotationTableProps {
  /** Column headers — e.g. weeks ("1週", "2週") or dates. */
  columns: string[];
  /** Row labels — e.g. duties ("そうじ", "日直") or slots. */
  rows: string[];
  /** cells[rowIndex][colIndex] = the person assigned to that slot. */
  cells: string[][];
  /** Index of the column to mark as the current period (boxed + highlighted). */
  currentColumn?: number;
  /** Optional caption above the table. */
  caption?: string;
}

const CELL_BASE: React.CSSProperties = {
  padding: "9px 14px",
  textAlign: "center",
  fontSize: 14,
  borderBottom: "1px solid var(--dt-table-border-light)",
  whiteSpace: "nowrap",
};

/**
 * The rotation table — toban-app's core printable artifact (当番表 / 早見表).
 * Members fill a duty × period grid; the "current" period is boxed with a
 * solid strong border and a soft highlight fill so it reads at a glance and
 * survives black-and-white printing.
 */
export function RotationTable({ columns, rows, cells, currentColumn, caption }: RotationTableProps) {
  return (
    <div style={{ fontFamily: "var(--dt-font-family)", color: "var(--dt-text)", padding: 4 }}>
      {caption ? (
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{caption}</div>
      ) : null}
      <div
        className="theme-border theme-radius theme-shadow-sm"
        style={{ overflow: "hidden", background: "var(--dt-card-bg)", display: "inline-block" }}
      >
        <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...CELL_BASE, background: "var(--dt-control-bar-bg)", color: "var(--dt-control-bar-text)", fontWeight: 700 }} />
              {columns.map((c, i) => {
                const isCurrent = i === currentColumn;
                return (
                  <th
                    key={c + i}
                    style={{
                      ...CELL_BASE,
                      fontWeight: 800,
                      background: isCurrent ? "var(--dt-current-highlight)" : "var(--dt-control-bar-bg)",
                      color: "var(--dt-control-bar-text)",
                      borderLeft: isCurrent ? "2px solid var(--dt-table-border-strong)" : "1px solid transparent",
                      borderRight: isCurrent ? "2px solid var(--dt-table-border-strong)" : "1px solid transparent",
                      borderTop: isCurrent ? "2px solid var(--dt-table-border-strong)" : undefined,
                    }}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r + ri}>
                <td style={{ ...CELL_BASE, fontWeight: 700, background: "var(--dt-control-bar-bg)", color: "var(--dt-control-bar-text)" }}>
                  {r}
                </td>
                {columns.map((_, ci) => {
                  const isCurrent = ci === currentColumn;
                  const isLastRow = ri === rows.length - 1;
                  return (
                    <td
                      key={ci}
                      style={{
                        ...CELL_BASE,
                        background: isCurrent ? "var(--dt-current-highlight)" : "var(--dt-card-bg)",
                        borderLeft: isCurrent ? "2px solid var(--dt-table-border-strong)" : "1px solid transparent",
                        borderRight: isCurrent ? "2px solid var(--dt-table-border-strong)" : "1px solid transparent",
                        borderBottom: isCurrent && isLastRow
                          ? "2px solid var(--dt-table-border-strong)"
                          : "1px solid var(--dt-table-border-light)",
                      }}
                    >
                      {cells[ri]?.[ci] ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
