/**
 * トップ（/）と LP（/about）の検索タイトル。
 * client/index.html の title / og:title / twitter:title は静的なので手で書いており、
 * shared/seo-templates.test.ts で一致を見張っている。
 */
export const SITE_TITLE =
  "当番表アプリ toban｜無料で簡単作成・印刷・LINEで共有";

/**
 * toban を操作できる AI（WebMCP 対応のエージェント）。LP・FAQ・bot 向け LP の文言に差し込む。
 * 実際に使えるようになったものだけを書く（予定は書かない）。
 */
export const AI_AGENTS = {
  ja: "ChatGPT デスクトップアプリ",
  en: "the ChatGPT desktop app",
};
