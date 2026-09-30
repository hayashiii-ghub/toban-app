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
/**
 * OG 画像（共有したときのカード画像）の場所。絵柄を変えたら v を上げる。
 * LINE や X は画像をアドレスごとに覚えているので、アドレスが変わらないと古い画像が出続ける。
 * client/index.html の og:image / twitter:image は手書きで、shared/seo-templates.test.ts が一致を見張る
 */
export const OG_IMAGE_PATH = "/og-image.png?v=2";

export const AI_AGENTS = {
  ja: "ChatGPT デスクトップアプリ",
  en: "the ChatGPT desktop app",
};
