import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface PopoverMenuProps {
  /** 開いたボタンやタブの位置。メニューはこの下（入らなければ上）に出す */
  anchor: DOMRect;
  /** start はメニューの左端を、end は右端を anchor に揃える */
  align?: "start" | "end";
  label: string;
  /** 何も選ばずに閉じた（外を押した・Esc・Tab・スクロール） */
  onDismiss: () => void;
  /** 開いたボタン。押したときは開け閉めをボタンに任せる（外を押した扱いにしない） */
  triggerRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

const EDGE = 8;
const GAP = 6;
const ITEMS = '[role="menuitem"]:not(:disabled)';

/** 小さなメニュー（当番表タブのメニュー、スマホの「⋯」メニュー） */
export function PopoverMenu({
  anchor,
  align = "start",
  label,
  onDismiss,
  triggerRef,
  children,
}: PopoverMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 描いた後の大きさで位置を決める。state にせず直接書くので、ちらつかない
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const below = anchor.bottom + GAP;
    const top =
      below + el.offsetHeight <= window.innerHeight - EDGE
        ? below
        : Math.max(EDGE, anchor.top - GAP - el.offsetHeight);
    const preferred =
      align === "end" ? anchor.right - el.offsetWidth : anchor.left;
    const left = Math.min(
      Math.max(EDGE, preferred),
      window.innerWidth - el.offsetWidth - EDGE
    );
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }, [anchor, align]);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>(ITEMS)?.focus();
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef?.current?.contains(target)) return;
      if (!menuRef.current?.contains(target)) onDismiss();
    };
    const handleMoved = () => onDismiss();
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", handleMoved);
    window.addEventListener("scroll", handleMoved, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", handleMoved);
      window.removeEventListener("scroll", handleMoved, true);
    };
  }, [onDismiss, triggerRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLElement>(ITEMS) ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) =>
      items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case "Escape":
      case "Tab":
        e.preventDefault();
        onDismiss();
        break;
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="fixed z-50 min-w-[11rem] py-1 theme-border theme-shadow rotation-no-print"
      style={{
        top: -9999,
        left: -9999,
        backgroundColor: "var(--dt-card-bg)",
        borderRadius: "var(--dt-border-radius-sm)",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

const ITEM_CLASS =
  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-left outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent";

type PopoverMenuItemProps = {
  icon: ReactNode;
  children: ReactNode;
  danger?: boolean;
} & (
  | { onSelect: () => void; disabled?: boolean; href?: never }
  | { href: string; newTab?: boolean; onSelect?: () => void }
);

/** onSelect ならボタン、href ならリンクになる */
export function PopoverMenuItem(props: PopoverMenuItemProps) {
  const { icon, children, danger } = props;
  const style = { color: danger ? "#DC2626" : "var(--dt-text)" };
  if (props.href !== undefined) {
    return (
      <a
        role="menuitem"
        href={props.href}
        onClick={props.onSelect}
        {...(props.newTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={ITEM_CLASS}
        style={style}
      >
        {icon}
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      disabled={props.disabled}
      onClick={props.onSelect}
      className={ITEM_CLASS}
      style={style}
    >
      {icon}
      {children}
    </button>
  );
}

export function PopoverMenuSeparator() {
  return (
    <div
      role="separator"
      className="my-1"
      style={{ borderTop: "1px solid var(--dt-table-border-light)" }}
    />
  );
}
