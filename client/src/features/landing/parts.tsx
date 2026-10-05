import type { ReactNode } from "react";
import { Link } from "wouter";
import { MEMBER_PRESETS } from "@shared/appearance";
import { LP_COLORS as C } from "./theme";

type Tone = (typeof MEMBER_PRESETS)[number];

/** 黒板の下の木枠（チョーク受け） */
export function ChalkEdge() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-3"
      style={{ backgroundColor: C.border }}
    />
  );
}

/** テンプレートのカード。上辺の色帯と絵文字の地の色を tone で揃える */
export function TemplateCard({
  href,
  emoji,
  name,
  tasks,
  meta,
  tone,
}: {
  href: string;
  emoji: string;
  name: string;
  tasks: string;
  meta?: ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.line}`,
        borderTop: `4px solid ${tone.color}`,
        borderRadius: "8px",
      }}
    >
      <span
        aria-hidden="true"
        className="size-10 flex-shrink-0 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: tone.bgColor }}
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm group-hover:underline"
          style={{ color: C.text }}
        >
          {name}
        </div>
        <div
          className="text-xs mt-1 line-clamp-2"
          style={{ color: C.textMuted }}
        >
          {tasks}
        </div>
        {meta && (
          <div className="text-xs mt-1" style={{ color: C.textMuted }}>
            {meta}
          </div>
        )}
      </div>
    </Link>
  );
}
