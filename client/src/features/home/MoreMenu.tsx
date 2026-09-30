import { useCallback, useRef, useState } from "react";
import { Languages, MoreHorizontal } from "lucide-react";
import { PopoverMenu, PopoverMenuItem } from "@/components/PopoverMenu";
import { SITE_LINKS } from "@/components/siteLinks";
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
          {SITE_LINKS.map(link => (
            <PopoverMenuItem
              key={link.href}
              icon={link.icon}
              href={link.href}
              newTab={link.newTab}
              onSelect={close}
            >
              {t(link.labelKey)}
            </PopoverMenuItem>
          ))}
        </PopoverMenu>
      )}
    </>
  );
}
