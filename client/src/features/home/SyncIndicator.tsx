import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import type { SyncStatus } from "@/lib/syncManager";

interface SyncIndicatorProps {
  status: SyncStatus;
  hasSlug: boolean;
}

export function SyncIndicator({ status, hasSlug }: SyncIndicatorProps) {
  // Show syncing/error states even before sharing (auto-backup)
  if (!hasSlug && status === "idle") return null;

  const config = {
    idle: { icon: Cloud, text: "バックアップ済み", color: "#999" },
    syncing: { icon: Loader2, text: "保存中...", color: "#3B82F6" },
    synced: { icon: Check, text: hasSlug ? "同期完了" : "バックアップ済み", color: "#10B981" },
    error: { icon: CloudOff, text: "保存エラー", color: "#EF4444" },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-1 text-xs font-medium rotation-no-print"
      style={{ color: config.color }}
    >
      <Icon className={`size-3 ${status === "syncing" ? "animate-spin" : ""}`} />
      <span>{config.text}</span>
    </div>
  );
}
