import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { schedules } from "../db/schema";
import { ensureSchedulesSchema } from "../db/ensureSchema";
import {
  TEMPLATE_SEO_DATA,
  TEMPLATE_SEO_MAP,
  TEMPLATE_CATEGORIES,
  COMMON_FAQ,
  JUNBAN_PAGE_SEO,
} from "../../shared/seo-templates";
import { faqPageSchema, breadcrumbSchema, serializeJsonLd } from "../../shared/jsonLd";

interface Env {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
}

const BOT_UA_PATTERN =
  /facebookexternalhit|Twitterbot|LinkedInBot|Line\/|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

export function isBot(ua: string): boolean {
  return BOT_UA_PATTERN.test(ua);
}

// SPA が実際に画面を持つルート（client/src/App.tsx の Route 定義と対応）。
// bot がここに無いパスを踏んだら 404 status を返し、SPA fallback の 200 による soft-404 を防ぐ。
const KNOWN_APP_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/about$/,
  /^\/templates$/,
  /^\/s\/[a-zA-Z0-9_-]+$/,
  /^\/transfer$/,
  /^\/junban$/,
  // /404 は意図的に含めない: 404 ページ自体は bot に実 404 status を返す
];

export function isKnownAppRoute(pathname: string): boolean {
  // テンプレ詳細は実在 slug のみ既知扱い（実在しない slug を index させない）
  const templateMatch = pathname.match(/^\/templates\/([a-z0-9-]+)$/);
  if (templateMatch) return TEMPLATE_SEO_MAP.has(templateMatch[1]);
  return KNOWN_APP_ROUTES.some((re) => re.test(pathname));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── ソーシャルメタタグ生成（OGP + Twitter Card） ───

export function buildSocialMetaTags(args: {
  title: string;
  description: string;
  url: string;
  origin: string;
  type?: "website" | "article";
}): string {
  const t = args.type ?? "website";
  const safeTitle = escapeHtml(args.title);
  const safeDesc = escapeHtml(args.description);
  const safeUrl = escapeHtml(args.url);
  const imageUrl = `${args.origin}/og-image.png`;
  return [
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDesc}">`,
    `<meta property="og:url" content="${safeUrl}">`,
    `<meta property="og:type" content="${t}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="ja_JP">`,
    `<meta property="og:site_name" content="toban">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDesc}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
  ].join("\n");
}

// ─── 共有スケジュールのOGP注入 ───

/**
 * SPA の index.html に共有スケジュール用の title/canonical/OGP を注入する。
 * 元 HTML にはトップページ用の og:/twitter:/canonical が焼き込まれており、
 * 残すとスクレイパー（先頭タグ優先）がトップの OGP を拾うため、先に除去してから注入する。
 */
export function injectScheduleOgp(
  html: string,
  args: { name: string; url: string; origin: string },
): string {
  const title = `${args.name} - toban`;

  // 置換文字列は replacer 関数で渡す: user 由来の name に $` / $& 等の
  // substitution pattern が含まれても発火させない（escapeHtml は $ を無害化しない）。
  // 除去 regex は行アンカーに依存させず、minify された HTML でも除去できる形にする。
  const out = html
    .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta (?:property="og:|name="twitter:)[^>]*\/?>\s*/g, "")
    .replace(/<link rel="canonical"[^>]*\/?>\s*/g, "");

  const tags = [
    `<link rel="canonical" href="${escapeHtml(args.url)}">`,
    ...buildSocialMetaTags({
      title,
      description: `「${args.name}」の当番表`,
      url: args.url,
      origin: args.origin,
      type: "website",
    }).split("\n"),
  ];
  const indented = tags.map((line) => `    ${line}`).join("\n");
  return out.replace("</head>", () => `${indented}\n  </head>`);
}

export async function handleScheduleOgp(
  url: URL,
  env: Env,
  slug: string,
): Promise<Response> {
  await ensureSchedulesSchema(env.DB);
  const db = drizzle(env.DB);
  const [schedule] = await db
    .select({ name: schedules.name, isPublic: schedules.isPublic })
    .from(schedules)
    .where(eq(schedules.slug, slug))
    .limit(1);

  if (!schedule || !schedule.isPublic) {
    return new Response("Not found", { status: 404 });
  }

  const assetResponse = await env.ASSETS.fetch(new Request(`${url.origin}/`));
  const html = injectScheduleOgp(await assetResponse.text(), {
    name: schedule.name,
    url: url.href,
    origin: url.origin,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

// ─── LP のプリレンダリング (bot用) ───

export function renderLandingPageHtml(origin: string): string {
  const title = "当番表作成アプリ toban（トバン）｜無料で作成・印刷・共有";
  const desc = "掃除当番・給食当番・日直のローテーション表をかんたんに作れる無料の当番表作成アプリ。アカウント登録・インストール不要、エクセルがなくてもブラウザだけで印刷品質の当番表がすぐ完成します。";

  const faqHtml = COMMON_FAQ.map(
    (f) => `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`,
  ).join("");

  const templateListHtml = TEMPLATE_SEO_DATA.slice(0, 6)
    .map(
      (t) =>
        `<li><a href="${origin}/templates/${t.slug}">${escapeHtml(t.heading)}</a></li>`,
    )
    .join("");

  const schema = serializeJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "toban",
      url: `${origin}/`,
      description: desc,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "All",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    },
    faqPageSchema(COMMON_FAQ),
  ]);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${origin}/">
${buildSocialMetaTags({ title, description: desc, url: `${origin}/`, origin, type: "website" })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script type="application/ld+json">${schema}</script>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(desc)}</p>
<a href="${origin}/">当番表を作る</a>
<h2>tobanの特徴</h2>
<ul>
<li>登録不要・エクセル不要 — アカウントもExcelテンプレートも要らず、ブラウザだけで完結</li>
<li>印刷がきれい — カード・一覧表・カレンダー・円盤の4形式</li>
<li>URLで共有 — LINEやメールで送れる</li>
<li>完全無料 — すべての機能を無料で利用可能</li>
</ul>
<h2>すぐ使えるテンプレート</h2>
<ul>${templateListHtml}</ul>
<a href="${origin}/templates">テンプレート一覧を見る</a>
<h2>当番の順番をルーレット感覚で決める</h2>
<p>名前を入れて回すだけ、円盤ビューで当番・係の順番がひと目でわかります。<a href="${origin}${JUNBAN_PAGE_SEO.path}">順番決め・当番ルーレットのページはこちら</a></p>
<h2>よくある質問</h2>
<dl>${faqHtml}</dl>
</main>
<footer><a href="${origin}/">当番表を作る</a> | <a href="${origin}/templates">テンプレート一覧</a> | <a href="${origin}${JUNBAN_PAGE_SEO.path}">順番決め・ルーレット</a></footer>
</body>
</html>`;
}

// ─── テンプレートページのプリレンダリング (bot用) ───

export function renderTemplateListHtml(origin: string): string {
  const title = "当番表テンプレート一覧｜無料で使えるtoban（トバン）";
  const desc = `掃除当番・給食当番・日直など、すぐ使える無料テンプレートを${TEMPLATE_SEO_DATA.length}種類ご用意。テンプレートを選んで、メンバーや担当を編集するだけで当番表が完成します。`;

  const categoryHtml = TEMPLATE_CATEGORIES.map((cat) => {
    const templates = TEMPLATE_SEO_DATA.filter((t) => t.categoryId === cat.id);
    if (templates.length === 0) return "";
    const items = templates
      .map(
        (t) =>
          `<li><a href="${origin}/templates/${t.slug}">${escapeHtml(t.heading)}</a><p>${escapeHtml(t.description)}</p></li>`,
      )
      .join("\n");
    return `<section><h2>${cat.emoji} ${escapeHtml(cat.label)}</h2><p>${escapeHtml(cat.description)}</p><ul>${items}</ul></section>`;
  }).join("\n");

  const faqSchema = serializeJsonLd(faqPageSchema(COMMON_FAQ));

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${origin}/templates">
${buildSocialMetaTags({ title, description: desc, url: `${origin}/templates`, origin, type: "website" })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script type="application/ld+json">${faqSchema}</script>
</head>
<body>
<header><nav><a href="${origin}/about">toban について</a> / <span>テンプレート一覧</span></nav></header>
<main>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(desc)}</p>
${categoryHtml}
<h2>よくある質問</h2>
<dl>${COMMON_FAQ.map((f) => `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`).join("")}</dl>
</main>
<footer><a href="${origin}/about">toban について</a></footer>
</body>
</html>`;
}

export function renderTemplateDetailHtml(origin: string, slug: string): string | null {
  const seo = TEMPLATE_SEO_MAP.get(slug);
  if (!seo) return null;

  const cat = TEMPLATE_CATEGORIES.find((c) => c.id === seo.categoryId);
  const fullTitle = `${seo.title}｜toban（トバン）`;

  const faqAndBreadcrumb = serializeJsonLd([
    faqPageSchema(COMMON_FAQ),
    breadcrumbSchema([
      { name: "toban について", item: `${origin}/about` },
      { name: "テンプレート一覧", item: `${origin}/templates` },
      { name: seo.heading },
    ]),
  ]);

  const sameCategory = TEMPLATE_SEO_DATA.filter(
    (t) => t.categoryId === seo.categoryId && t.slug !== slug,
  );
  const otherCategory = TEMPLATE_SEO_DATA.filter(
    (t) => t.categoryId !== seo.categoryId,
  );
  const relatedTemplates = [
    ...sameCategory,
    ...otherCategory.slice(0, Math.max(0, 4 - sameCategory.length)),
  ].slice(0, 4);

  const relatedHtml = relatedTemplates.length > 0
    ? `<section><h2>関連するテンプレート</h2><ul>${relatedTemplates
        .map(
          (t) =>
            `<li><a href="${origin}/templates/${t.slug}">${escapeHtml(t.heading)}</a></li>`,
        )
        .join("")}</ul></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(seo.description)}">
<link rel="canonical" href="${origin}/templates/${slug}">
${buildSocialMetaTags({ title: fullTitle, description: seo.description, url: `${origin}/templates/${slug}`, origin, type: "article" })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script type="application/ld+json">${faqAndBreadcrumb}</script>
</head>
<body>
<header><nav><a href="${origin}/about">toban について</a> / <a href="${origin}/templates">テンプレート一覧</a> / <span>${escapeHtml(seo.heading)}</span></nav></header>
<main>
${cat ? `<p>${cat.emoji} ${escapeHtml(cat.label)}</p>` : ""}
<h1>${escapeHtml(seo.heading)}</h1>
<p>${escapeHtml(seo.intro)}</p>
<a href="${origin}/?template=${seo.templateIndex}">このテンプレートで当番表を作る</a>
${relatedHtml}
<h2>よくある質問</h2>
<dl>${COMMON_FAQ.map((f) => `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`).join("")}</dl>
</main>
<footer><a href="${origin}/templates">テンプレート一覧に戻る</a> | <a href="${origin}/about">toban について</a></footer>
</body>
</html>`;
}

// ─── 順番決め/ルーレットページ (/junban) のプリレンダリング (bot用) ───

export function renderJunbanHtml(origin: string): string {
  const seo = JUNBAN_PAGE_SEO;
  const url = `${origin}${seo.path}`;

  const schema = serializeJsonLd([
    faqPageSchema(seo.faq),
    breadcrumbSchema([
      { name: "toban について", item: `${origin}/about` },
      { name: seo.heading },
    ]),
  ]);

  const benefitsHtml = seo.benefits
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("");
  const faqHtml = seo.faq
    .map((f) => `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(seo.title)}</title>
<meta name="description" content="${escapeHtml(seo.description)}">
<link rel="canonical" href="${url}">
${buildSocialMetaTags({ title: seo.title, description: seo.description, url, origin, type: "article" })}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script type="application/ld+json">${schema}</script>
</head>
<body>
<header><nav><a href="${origin}/about">toban について</a> / <span>${escapeHtml(seo.heading)}</span></nav></header>
<main>
<h1>${escapeHtml(seo.heading)}</h1>
<p>${escapeHtml(seo.intro)}</p>
<ul>${benefitsHtml}</ul>
<a href="${origin}/?view=disc">円盤ビューで順番を決める</a>
<h2>よくある質問</h2>
<dl>${faqHtml}</dl>
</main>
<footer><a href="${origin}/">当番表を作る</a> | <a href="${origin}/templates">テンプレート一覧</a> | <a href="${origin}/about">toban について</a></footer>
</body>
</html>`;
}

// ─── 動的 sitemap.xml ───

export async function handleSitemap(origin: string, env: Env): Promise<Response> {
  const today = new Date().toISOString().split("T")[0];

  let urls = `  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/templates</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}${JUNBAN_PAGE_SEO.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  for (const tpl of TEMPLATE_SEO_DATA) {
    urls += `
  <url>
    <loc>${origin}/templates/${tpl.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  try {
    await ensureSchedulesSchema(env.DB);
    const db = drizzle(env.DB);
    const recentSchedules = await db
      .select({ slug: schedules.slug, updatedAt: schedules.updatedAt })
      .from(schedules)
      .where(eq(schedules.isPublic, true))
      .orderBy(desc(schedules.updatedAt))
      .limit(200);

    for (const s of recentSchedules) {
      const lastmod = s.updatedAt ? s.updatedAt.split("T")[0] : today;
      urls += `
  <url>
    <loc>${origin}/s/${s.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }
  } catch (error) {
    console.error("[sitemap] DB query failed, returning sitemap without schedules:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// ─── 動的 robots.txt ───

export function handleRobots(origin: string): Response {
  const text = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /transfer

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
