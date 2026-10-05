/** カレンダーが読みに来る URL（server/routes/schedules.ts の calendar.ics） */
export function calendarFeedUrl(
  origin: string,
  slug: string,
  memberId: string | null,
  locale: string
): string {
  const params = new URLSearchParams();
  if (memberId) params.set("member", memberId);
  if (locale === "en") params.set("lang", "en");
  const query = params.toString();
  return `${origin}/api/schedules/${encodeURIComponent(slug)}/calendar.ics${query ? `?${query}` : ""}`;
}

/** 購読用のリンク。Apple は webcal: を開くと購読の確認が出る。Google は cid に webcal: の URL を渡す */
export function calendarLinks(feedUrl: string) {
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  return {
    feed: feedUrl,
    apple: webcal,
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
  };
}
