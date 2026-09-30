import {
  GripVertical,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pin,
} from "lucide-react";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import type { DragEvent } from "react";
import type { Schedule } from "@/rotation/types";
import { useT } from "@/i18n";
import { TabMenu, type TabMenuTarget } from "./TabMenu";

// 長押しとみなす時間と、指がこれ以上動いたら長押しをやめる距離（px）
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

interface ScheduleTabsProps {
  schedules: Schedule[];
  activeScheduleId: string;
  draggedTabId: string | null;
  dragOverTabId: string | null;
  onSelectSchedule: (scheduleId: string) => void;
  onAddSchedule: () => void;
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    scheduleId: string
  ) => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>, scheduleId: string) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>, scheduleId: string) => void;
  onDragEnd: () => void;
  onReorderTab: (scheduleId: string, direction: "left" | "right") => void;
  onTogglePin: (scheduleId: string) => void;
  /** 選んでいる当番表を複製する（メニューを開くときにそのタブを選ぶ） */
  onDuplicate: () => void;
  onRequestDelete: (scheduleId: string) => void;
}

export function ScheduleTabs({
  schedules,
  activeScheduleId,
  draggedTabId,
  dragOverTabId,
  onSelectSchedule,
  onAddSchedule,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onReorderTab,
  onTogglePin,
  onDuplicate,
  onRequestDelete,
}: ScheduleTabsProps) {
  const t = useT();
  const sortedSchedules = useMemo(() => {
    const pinned = schedules.filter(s => s.pinned);
    const unpinned = schedules.filter(s => !s.pinned);
    return [...pinned, ...unpinned];
  }, [schedules]);

  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [menu, setMenu] = useState<TabMenuTarget | null>(null);
  const longPress = useRef<{ timer: number; x: number; y: number } | null>(
    null
  );
  // タッチ主体の端末ではドラッグで並べ替えられない（長押しがドラッグと取り合う）ので、
  // マウスなどの細かい指し示しがある端末だけドラッグを有効にする。スマホはメニューの左右へ移動で並べ替える
  const canDrag = useMemo(
    () => window.matchMedia?.("(pointer: fine)").matches ?? true,
    []
  );

  const cancelLongPress = useCallback(() => {
    if (!longPress.current) return;
    window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  }, []);
  useEffect(() => cancelLongPress, [cancelLongPress]);

  const openMenu = (index: number) => {
    const schedule = sortedSchedules[index];
    const el = schedule && tabRefs.current.get(schedule.id);
    if (!schedule || !el) return;
    onSelectSchedule(schedule.id);
    const prev = sortedSchedules[index - 1];
    const next = sortedSchedules[index + 1];
    setMenu({
      scheduleId: schedule.id,
      name: schedule.name,
      pinned: !!schedule.pinned,
      anchor: el.getBoundingClientRect(),
      canMoveLeft: !schedule.pinned && !!prev && !prev.pinned,
      canMoveRight: !schedule.pinned && !!next,
      canDelete: schedules.length > 1,
    });
  };

  const closeMenu = (restoreFocus: boolean) => {
    const id = menu?.scheduleId;
    setMenu(null);
    if (restoreFocus && id) tabRefs.current.get(id)?.focus();
  };
  const dismissMenu = useCallback(() => {
    setMenu(current => {
      if (current) tabRefs.current.get(current.scheduleId)?.focus();
      return null;
    });
  }, []);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.pointerType === "mouse") return;
    cancelLongPress();
    longPress.current = {
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => {
        longPress.current = null;
        openMenu(index);
      }, LONG_PRESS_MS),
    };
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = longPress.current;
    if (
      start &&
      Math.hypot(e.clientX - start.x, e.clientY - start.y) > LONG_PRESS_SLOP
    )
      cancelLongPress();
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [schedules.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    scheduleId: string,
    index: number
  ) => {
    const tabs =
      scrollRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs) return;

    switch (e.key) {
      case "ArrowRight": {
        e.preventDefault();
        if (e.altKey) {
          const schedule = sortedSchedules[index];
          if (!schedule?.pinned) onReorderTab(scheduleId, "right");
        } else {
          const next = tabs[index + 1];
          if (next) next.focus();
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (e.altKey) {
          const schedule = sortedSchedules[index];
          if (!schedule?.pinned) onReorderTab(scheduleId, "left");
        } else {
          const prev = tabs[index - 1];
          if (prev) prev.focus();
        }
        break;
      }
      case "ContextMenu": {
        e.preventDefault();
        openMenu(index);
        break;
      }
      case "F10": {
        if (e.shiftKey) {
          e.preventDefault();
          openMenu(index);
        }
        break;
      }
      case "Home": {
        e.preventDefault();
        tabs[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        tabs[tabs.length - 1]?.focus();
        break;
      }
    }
  };

  return (
    <div
      className="px-3 sm:px-4 pt-2 pb-1 rotation-no-print"
      data-onboarding="schedule-tabs"
    >
      <div className="max-w-4xl mx-auto">
        <nav aria-label={t("tabs.navAria")}>
          <div className="relative flex items-center">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute left-0 z-10 size-7 flex items-center justify-center rounded-full sm:hidden"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--dt-page-bg) 90%, transparent)",
                  boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
                }}
                aria-label={t("tabs.scrollLeft")}
              >
                <ChevronLeft
                  className="size-4"
                  style={{ color: "var(--dt-text-secondary)" }}
                />
              </button>
            )}
            <div
              ref={scrollRef}
              role="tablist"
              aria-label={t("tabs.tablistAria")}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
            >
              {sortedSchedules.map((schedule, index) => (
                <button
                  type="button"
                  key={schedule.id}
                  role="tab"
                  aria-label={
                    t("tabs.tabAria", { name: schedule.name }) +
                    (schedule.pinned
                      ? t("tabs.pinnedSuffix")
                      : t("tabs.reorderSuffix"))
                  }
                  aria-selected={schedule.id === activeScheduleId}
                  aria-haspopup="menu"
                  tabIndex={schedule.id === activeScheduleId ? 0 : -1}
                  ref={el => {
                    if (el) tabRefs.current.set(schedule.id, el);
                    else tabRefs.current.delete(schedule.id);
                  }}
                  draggable={canDrag && !schedule.pinned}
                  onDragStart={event => onDragStart(event, schedule.id)}
                  onDragOver={event => onDragOver(event, schedule.id)}
                  onDrop={event => onDrop(event, schedule.id)}
                  onDragEnd={onDragEnd}
                  onKeyDown={e => handleTabKeyDown(e, schedule.id, index)}
                  onClick={() => onSelectSchedule(schedule.id)}
                  onDoubleClick={() => openMenu(index)}
                  onContextMenu={e => {
                    e.preventDefault();
                    cancelLongPress();
                    openMenu(index);
                  }}
                  onPointerDown={e => handlePointerDown(e, index)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  className={`theme-border shrink-0 px-3 sm:px-4 py-2 text-sm font-bold transition-all duration-150 flex items-center gap-1 sm:gap-1.5 select-none [-webkit-touch-callout:none] ${
                    schedule.id === activeScheduleId
                      ? "theme-shadow-sm"
                      : "opacity-70 hover:opacity-100"
                  } ${
                    dragOverTabId === schedule.id &&
                    draggedTabId !== schedule.id
                      ? "ring-2 ring-offset-1"
                      : ""
                  } ${draggedTabId === schedule.id ? "opacity-50" : ""}`}
                  style={{
                    backgroundColor:
                      schedule.id === activeScheduleId
                        ? "var(--dt-tab-active-bg)"
                        : "var(--dt-tab-inactive-bg)",
                    color:
                      schedule.id === activeScheduleId
                        ? "var(--dt-tab-active-text)"
                        : "var(--dt-tab-inactive-text)",
                    borderRadius: "var(--dt-border-radius-sm)",
                    cursor: canDrag && !schedule.pinned ? "grab" : "pointer",
                    ...(dragOverTabId === schedule.id &&
                    draggedTabId !== schedule.id
                      ? ({
                          "--tw-ring-color": "var(--dt-current-highlight)",
                        } as React.CSSProperties)
                      : {}),
                  }}
                >
                  {schedule.pinned ? (
                    <Pin
                      className="size-3 shrink-0 opacity-60"
                      aria-hidden="true"
                    />
                  ) : (
                    <GripVertical
                      className="size-3 opacity-40 shrink-0 hidden sm:block"
                      aria-hidden="true"
                    />
                  )}
                  <span className="max-w-[9rem] sm:max-w-[12rem] truncate">
                    {schedule.name}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={onAddSchedule}
                className="theme-border shrink-0 self-stretch px-2.5 sm:px-3 gap-1 text-sm font-bold transition-all duration-150 theme-hover-lift flex items-center"
                style={{
                  borderRadius: "var(--dt-border-radius-sm)",
                  backgroundColor: "var(--dt-button-bg)",
                }}
                aria-label={t("tabs.addAria")}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline" aria-hidden="true">
                  {t("tabs.add")}
                </span>
              </button>
            </div>
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute right-0 z-10 size-7 flex items-center justify-center rounded-full sm:hidden"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--dt-page-bg) 90%, transparent)",
                  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
                }}
                aria-label={t("tabs.scrollRight")}
              >
                <ChevronRight
                  className="size-4"
                  style={{ color: "var(--dt-text-secondary)" }}
                />
              </button>
            )}
          </div>
        </nav>
      </div>
      {menu && (
        <TabMenu
          target={menu}
          onTogglePin={() => {
            onTogglePin(menu.scheduleId);
            closeMenu(false);
          }}
          onMove={dir => {
            onReorderTab(menu.scheduleId, dir);
            closeMenu(false);
          }}
          onDuplicate={() => {
            onDuplicate();
            closeMenu(false);
          }}
          onDelete={() => {
            closeMenu(false);
            onRequestDelete(menu.scheduleId);
          }}
          onDismiss={dismissMenu}
        />
      )}
    </div>
  );
}
