import { useState, useEffect, type ReactNode } from "react";
import { X, Download, Share } from "lucide-react";
import { safeGetItem, safeSetItem } from "@/lib/storage";
import { useT } from "@/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Safari は beforeinstallprompt を出さないので、手順を文章で案内する
function detectSafariGuide(): "ios" | "macSafari" | null {
  const ua = navigator.userAgent;
  const isSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  if (!isSafari) return null;
  // iPadOS の Safari は Mac と同じ UA を名乗るので、タッチ対応で見分ける
  const isIPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || isIPad) return "ios";
  // 「Dock に追加」は Safari 17 から
  const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
  if (/Macintosh/.test(ua) && version >= 17) return "macSafari";
  return null;
}

function isStandalone(): boolean {
  return (
    ("standalone" in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

const DISMISS_KEY = "toban-install-dismissed";

function Banner({
  icon,
  title,
  description,
  action,
  onDismiss,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <div
      className="fixed bottom-[calc(1rem+var(--home-toolbar-space,0px)+env(safe-area-inset-bottom,0px))] left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 theme-border theme-shadow p-3 flex items-center gap-3"
      style={{
        backgroundColor: "var(--dt-current-highlight)",
        borderRadius: "var(--dt-border-radius)",
      }}
    >
      {icon}
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: "var(--dt-text)" }}>
          {title}
        </div>
        <div
          className="text-xs font-medium"
          style={{ color: "var(--dt-text-secondary)" }}
        >
          {description}
        </div>
      </div>
      {action}
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 hover:bg-yellow-400 rounded-lg transition-colors shrink-0"
        aria-label={t("common.close")}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function InstallPrompt() {
  const t = useT();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => safeGetItem(DISMISS_KEY) === "1"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    safeSetItem(DISMISS_KEY, "1");
  };
  const iconClass = "size-5 shrink-0";
  const iconStyle = { color: "var(--dt-text)" };

  // Chrome / Edge（Android と PC）: ブラウザのインストール画面を呼ぶ
  if (deferredPrompt) {
    const handleInstall = async () => {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    };
    const isMobile = /Android|Mobi/.test(navigator.userAgent);

    return (
      <Banner
        icon={<Download className={iconClass} style={iconStyle} />}
        title={t("install.promptTitle")}
        description={t(isMobile ? "install.mobileDesc" : "install.desktopDesc")}
        action={
          <button
            type="button"
            onClick={handleInstall}
            className="theme-border px-3 py-1.5 text-xs font-bold transition-all hover:translate-y-[-1px]"
            style={{
              backgroundColor: "var(--dt-card-bg)",
              borderRadius: "6px",
            }}
          >
            {t("install.add")}
          </button>
        }
        onDismiss={handleDismiss}
      />
    );
  }

  const guide = isStandalone() ? null : detectSafariGuide();
  if (guide === "ios") {
    return (
      <Banner
        icon={<Share className={iconClass} style={iconStyle} />}
        title={t("install.iosTitle")}
        description={t("install.iosDesc")}
        onDismiss={handleDismiss}
      />
    );
  }
  if (guide === "macSafari") {
    return (
      <Banner
        icon={<Download className={iconClass} style={iconStyle} />}
        title={t("install.macSafariTitle")}
        description={t("install.macSafariDesc")}
        onDismiss={handleDismiss}
      />
    );
  }

  return null;
}
