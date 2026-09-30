import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { useT } from "@/i18n";

export interface TabMenuTarget {
  scheduleId: string;
  name: string;
  pinned: boolean;
  /** 開いたタブの位置。メニューはこの下（入らなければ上）に出す */
  anchor: DOMRect;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canDelete: boolean;
}

interface TabMenuProps {
  target: TabMenuTarget;
  onTogglePin: () => void;
  onMove: (dir: "left" | "right") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** 何も選ばずに閉じた（外を押した・Esc・スクロール） */
  onDismiss: () => void;
}

const EDGE = 8;
const GAP = 6;

/** 当番表タブを長押し・右クリック・ダブルクリック・Shift+F10 したときのメニュー */
export function TabMenu({
  target,
  onTogglePin,
  onMove,
  onDuplicate,
  onDelete,
  onDismiss,
}: TabMenuProps) {
  const t = useT();
  const menuRef = useRef<HTMLDivElement>(null);

  // 描いた後の大きさで位置を決める。state にせず直接書くので、ちらつかない
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { anchor } = target;
    const below = anchor.bottom + GAP;
    const top =
      below + el.offsetHeight <= window.innerHeight - EDGE
        ? below
        : Math.max(EDGE, anchor.top - GAP - el.offsetHeight);
    const left = Math.min(
      Math.max(EDGE, anchor.left),
      window.innerWidth - el.offsetWidth - EDGE
    );
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }, [target]);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
  }, [target.scheduleId]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onDismiss();
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
  }, [onDismiss]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)'
      ) ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
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
      aria-label={t("tabs.menuAria", { name: target.name })}
      onKeyDown={handleKeyDown}
      className="fixed z-50 min-w-[11rem] py-1 theme-border theme-shadow rotation-no-print"
      style={{
        top: -9999,
        left: -9999,
        backgroundColor: "var(--dt-card-bg)",
        borderRadius: "var(--dt-border-radius-sm)",
      }}
    >
      <MenuItem
        icon={
          target.pinned ? (
            <PinOff className="size-4" aria-hidden="true" />
          ) : (
            <Pin className="size-4" aria-hidden="true" />
          )
        }
        onSelect={onTogglePin}
      >
        {target.pinned ? t("tabs.menu.unpin") : t("tabs.menu.pin")}
      </MenuItem>
      {/* ピン留めしたタブは先頭に固定されるので、並べ替えの対象にしない */}
      {!target.pinned && (
        <>
          <MenuItem
            icon={<ChevronLeft className="size-4" aria-hidden="true" />}
            disabled={!target.canMoveLeft}
            onSelect={() => onMove("left")}
          >
            {t("tabs.menu.moveLeft")}
          </MenuItem>
          <MenuItem
            icon={<ChevronRight className="size-4" aria-hidden="true" />}
            disabled={!target.canMoveRight}
            onSelect={() => onMove("right")}
          >
            {t("tabs.menu.moveRight")}
          </MenuItem>
        </>
      )}
      <MenuItem
        icon={<Copy className="size-4" aria-hidden="true" />}
        onSelect={onDuplicate}
      >
        {t("common.duplicate")}
      </MenuItem>
      {target.canDelete && (
        <>
          <div
            role="separator"
            className="my-1"
            style={{ borderTop: "1px solid var(--dt-table-border-light)" }}
          />
          <MenuItem
            icon={<Trash2 className="size-4" aria-hidden="true" />}
            danger
            onSelect={onDelete}
          >
            {t("common.delete")}
          </MenuItem>
        </>
      )}
    </div>,
    document.body
  );
}

function MenuItem({
  icon,
  children,
  onSelect,
  disabled,
  danger,
}: {
  icon: ReactNode;
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-left outline-none transition-colors hover:bg-black/5 focus-visible:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
      style={{ color: danger ? "#DC2626" : "var(--dt-text)" }}
    >
      {icon}
      {children}
    </button>
  );
}
