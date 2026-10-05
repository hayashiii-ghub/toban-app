import { useState } from "react";
import { CalendarDays, CalendarPlus } from "lucide-react";
import type { Member } from "@/rotation/types";
import { useLocale, useT } from "@/i18n";
import { calendarFeedUrl, calendarLinks } from "@/lib/calendarLinks";

/**
 * Google と Apple のカレンダーに購読してもらうボタン。見た目は共有の画面の「URLをコピー」に揃える。
 * 当番表を直すと、カレンダーが読み直したときに反映される。知らせはカレンダーの通知の設定で出す
 */
export function CalendarButtons({
  slug,
  memberId,
  className,
}: {
  slug: string;
  /** 省くと全員の当番 */
  memberId?: string | null;
  /** 並べ方（grid の列など） */
  className: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const links = calendarLinks(
    calendarFeedUrl(window.location.origin, slug, memberId ?? null, locale)
  );

  const buttonClass =
    "theme-border theme-shadow-sm w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold transition-all duration-150 theme-hover-lift";
  const buttonStyle = {
    backgroundColor: "var(--dt-card-bg)",
    color: "var(--dt-text)",
    borderRadius: "10px",
  };

  return (
    <div className={className}>
      <a
        href={links.google}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        style={buttonStyle}
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
        {t("calendar.google")}
      </a>
      <a href={links.apple} className={buttonClass} style={buttonStyle}>
        <CalendarPlus className="size-4" aria-hidden="true" />
        {t("calendar.apple")}
      </a>
    </div>
  );
}

/** 共有ページで、受け取った人が自分の当番（または全員の当番）をカレンダーに入れる */
export function CalendarSubscribe({
  slug,
  member,
}: {
  slug: string;
  /** 名前を選んでいれば「この人の分」と「全員分」から選べる。省くと全員分 */
  member?: Member;
}) {
  const t = useT();
  const [mineOnly, setMineOnly] = useState(true);

  // 共有の画面の「見るだけ／編集もできる」に見た目を揃える
  const choiceClass = (selected: boolean) =>
    `theme-border py-2 text-sm font-bold truncate transition-all duration-150 ${
      selected ? "theme-shadow-sm" : "theme-hover-lift"
    }`;
  const choiceStyle = (selected: boolean) => ({
    backgroundColor: selected
      ? "var(--dt-tab-active-bg)"
      : "var(--dt-tab-inactive-bg)",
    color: selected
      ? "var(--dt-tab-active-text)"
      : "var(--dt-tab-inactive-text)",
    borderRadius: "var(--dt-border-radius-sm)",
  });

  return (
    <div className="flex flex-col gap-3">
      <h3
        className="flex items-center gap-1.5 text-sm font-bold"
        style={{ color: "var(--dt-text-secondary)" }}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        {t("calendar.add")}
      </h3>
      {member && (
        <div
          role="group"
          aria-label={t("calendar.who")}
          className="grid grid-cols-2 gap-2"
        >
          {[true, false].map(mine => (
            <button
              key={String(mine)}
              type="button"
              aria-pressed={mineOnly === mine}
              onClick={() => setMineOnly(mine)}
              className={choiceClass(mineOnly === mine)}
              style={choiceStyle(mineOnly === mine)}
            >
              {mine
                ? t("calendar.mine", { name: member.name })
                : t("calendar.everyone")}
            </button>
          ))}
        </div>
      )}
      <CalendarButtons
        slug={slug}
        memberId={member && mineOnly ? member.id : null}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      />
      <p
        className="text-xs leading-relaxed"
        style={{ color: "var(--dt-text-muted)" }}
      >
        {t("calendar.note")}
      </p>
    </div>
  );
}
