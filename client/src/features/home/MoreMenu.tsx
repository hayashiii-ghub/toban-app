import { useCallback, useRef, useState } from "react";
import { CircleHelp, Languages, MoreHorizontal, Shield } from "lucide-react";
import { PopoverMenu, PopoverMenuItem } from "@/components/PopoverMenu";
import { useLocale, useT } from "@/i18n";

/**
 * スマホのホームの「⋯」メニュー。PC ではページの一番下にある案内（App.tsx の AppFooter）を
 * ここにまとめる。スマホは下に操作の帯を固定していて、ページの一番下が隠れやすいため
 */
export function MoreMenu() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const next = locale === "ja" ? "en" : "ja";

  const close = () => setAnchor(null);
  const dismiss = useCallback(() => {
    setAnchor(null);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() =>
          setAnchor(anchor ? null : buttonRef.current!.getBoundingClientRect())
        }
        aria-label={t("more.aria")}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        className="size-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
        style={{ color: "var(--dt-text-secondary)" }}
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </button>
      {anchor && (
        <PopoverMenu
          anchor={anchor}
          align="end"
          label={t("more.aria")}
          onDismiss={dismiss}
          triggerRef={buttonRef}
        >
          <PopoverMenuItem
            icon={<Languages className="size-4" aria-hidden="true" />}
            onSelect={() => {
              setLocale(next);
              close();
            }}
          >
            {t(next === "ja" ? "lang.ja" : "lang.en")}
          </PopoverMenuItem>
          <PopoverMenuItem
            icon={<CircleHelp className="size-4" aria-hidden="true" />}
            href="/about"
            newTab
            onSelect={close}
          >
            {t("footer.about")}
          </PopoverMenuItem>
          <PopoverMenuItem
            icon={<Shield className="size-4" aria-hidden="true" />}
            href="/privacy"
            onSelect={close}
          >
            {t("footer.privacy")}
          </PopoverMenuItem>
          <PopoverMenuItem
            icon={
              <img
                src="/hayashigoto-seal.svg"
                alt=""
                className="size-4 opacity-80"
              />
            }
            href="https://shigoto.dev/works/toban"
            newTab
            onSelect={close}
          >
            {t("footer.maker")}
          </PopoverMenuItem>
        </PopoverMenu>
      )}
    </>
  );
}
