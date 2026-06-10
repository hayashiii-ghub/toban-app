import { describe, it, expect } from "vitest";
import {
  buildSocialMetaTags,
  renderLandingPageHtml,
  renderTemplateListHtml,
  renderTemplateDetailHtml,
  handleSitemap,
  injectScheduleOgp,
  isKnownAppRoute,
  renderJunbanHtml,
} from "./seo";

describe("buildSocialMetaTags", () => {
  it("includes og:title, og:description, og:url, og:type", () => {
    const html = buildSocialMetaTags({
      title: "テスト記事",
      description: "テスト説明",
      url: "https://toban.app/test",
      origin: "https://toban.app",
      type: "article",
    });
    expect(html).toContain('<meta property="og:title" content="テスト記事"');
    expect(html).toContain('<meta property="og:description" content="テスト説明"');
    expect(html).toContain('<meta property="og:url" content="https://toban.app/test"');
    expect(html).toContain('<meta property="og:type" content="article"');
  });

  it("defaults type to website", () => {
    const html = buildSocialMetaTags({
      title: "x",
      description: "y",
      url: "https://toban.app/",
      origin: "https://toban.app",
    });
    expect(html).toContain('<meta property="og:type" content="website"');
  });

  it("includes og:image with 1200x630 dimensions pointing to /og-image.png", () => {
    const html = buildSocialMetaTags({
      title: "x",
      description: "y",
      url: "https://toban.app/",
      origin: "https://toban.app",
    });
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="og:image:height" content="630"');
  });

  it("includes Twitter summary_large_image card with title/description/image", () => {
    const html = buildSocialMetaTags({
      title: "テスト",
      description: "せつめい",
      url: "https://toban.app/",
      origin: "https://toban.app",
    });
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(html).toContain('<meta name="twitter:title" content="テスト"');
    expect(html).toContain('<meta name="twitter:description" content="せつめい"');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png"');
  });

  it("escapes HTML special characters in title and description", () => {
    const html = buildSocialMetaTags({
      title: '"危険な" <タグ>',
      description: "A & B",
      url: "https://toban.app/",
      origin: "https://toban.app",
    });
    expect(html).not.toContain('"危険な"');
    expect(html).toContain("&quot;危険な&quot;");
    expect(html).toContain("&lt;タグ&gt;");
    expect(html).toContain("A &amp; B");
  });
});

describe("render functions emit consistent OGP/Twitter tags", () => {
  const origin = "https://toban.app";

  it("renderLandingPageHtml は当番表アプリ/エクセル不要の検索語彙を含む", () => {
    // ③当番表アプリ・②エクセル代替クエリの受け皿。文言変更で語彙が落ちないよう固定。
    const html = renderLandingPageHtml(origin);
    expect(html).toContain("当番表アプリ");
    expect(html).toMatch(/エクセル|Excel/);
  });

  it("renderLandingPageHtml uses /og-image.png and twitter card", () => {
    const html = renderLandingPageHtml(origin);
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png">');
    expect(html).not.toMatch(/property="og:image"[^>]*pwa-512/);
    expect(html).not.toMatch(/name="twitter:image"[^>]*pwa-512/);
  });

  it("renderTemplateListHtml uses /og-image.png and twitter card", () => {
    const html = renderTemplateListHtml(origin);
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png">');
  });

  it("renderTemplateDetailHtml uses /og-image.png and twitter card", () => {
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png">');
  });
});

describe("injectScheduleOgp", () => {
  // index.html 相当: トップページ用の OGP/canonical を持つベース HTML
  const baseHtml = `<!doctype html>
<html lang="ja">
  <head>
    <title>当番表メーカー toban</title>
    <link rel="canonical" href="https://toban.app/" />
    <meta property="og:title" content="当番表メーカー toban" />
    <meta property="og:url" content="https://toban.app/" />
    <meta name="twitter:title" content="当番表メーカー toban" />
  </head>
  <body><div id="root"></div></body>
</html>`;

  const args = {
    name: "3年2組の掃除当番",
    url: "https://toban.app/s/abc123",
    origin: "https://toban.app",
  };

  it("title を共有スケジュール名に置き換える", () => {
    const html = injectScheduleOgp(baseHtml, args);
    expect(html).toContain("<title>3年2組の掃除当番 - toban</title>");
    expect(html).not.toContain("<title>当番表メーカー toban</title>");
  });

  it("トップページ用の og:/twitter: タグを残さない（スクレイパーの先頭タグ誤読防止）", () => {
    const html = injectScheduleOgp(baseHtml, args);
    expect(html).not.toContain('content="https://toban.app/" property');
    expect(html).not.toMatch(/og:title" content="当番表メーカー/);
    expect(html).not.toMatch(/twitter:title" content="当番表メーカー/);
    // og:title / og:url / twitter:title は共有ページ用の1つだけになる
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/property="og:url"/g)).toHaveLength(1);
    expect(html.match(/name="twitter:title"/g)).toHaveLength(1);
  });

  it("canonical を共有 URL に張り替える（sitemap 掲載と整合）", () => {
    const html = injectScheduleOgp(baseHtml, args);
    expect(html).toContain('<link rel="canonical" href="https://toban.app/s/abc123">');
    expect(html).not.toContain('<link rel="canonical" href="https://toban.app/" />');
  });

  it("スケジュール名の HTML 特殊文字をエスケープする", () => {
    const html = injectScheduleOgp(baseHtml, { ...args, name: '<script>"x"</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("スケジュール名の $ 置換パターン（$` / $&）で head 構造を汚染できない", () => {
    // String.replace の substitution pattern は escapeHtml では無害化されないため、
    // replacer 関数で渡さないとマッチ前方の HTML が title 内に複製注入される。
    const html = injectScheduleOgp(baseHtml, { ...args, name: "$`x$&y" });
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>$`x$&amp;y - toban</title>");
    expect(html).not.toContain("<title><!doctype");
  });

  it("minify された1行 HTML でも元の og:/twitter:/canonical を除去できる", () => {
    const minified =
      '<!doctype html><html lang="ja"><head><title>当番表メーカー toban</title>' +
      '<link rel="canonical" href="https://toban.app/"/>' +
      '<meta property="og:title" content="当番表メーカー toban"/>' +
      '<meta name="twitter:title" content="当番表メーカー toban"/>' +
      '</head><body><div id="root"></div></body></html>';
    const html = injectScheduleOgp(minified, args);
    expect(html).not.toMatch(/og:title" content="当番表メーカー/);
    expect(html).not.toMatch(/twitter:title" content="当番表メーカー/);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://toban.app/s/abc123">');
  });
});

describe("handleSitemap", () => {
  // DB なし（ensureSchedulesSchema が throw）でも静的ルート分の sitemap は返る設計。
  const envWithoutDb = {} as never;

  it("DB が無くても / と /about と /templates を含む sitemap を返す", async () => {
    const res = await handleSitemap("https://toban.app", envWithoutDb);
    expect(res.headers.get("Content-Type")).toContain("application/xml");
    const xml = await res.text();
    expect(xml).toContain("<loc>https://toban.app/</loc>");
    expect(xml).toContain("<loc>https://toban.app/about</loc>");
    expect(xml).toContain("<loc>https://toban.app/templates</loc>");
  });

  it("全テンプレート詳細 URL を含む", async () => {
    const res = await handleSitemap("https://toban.app", envWithoutDb);
    const xml = await res.text();
    expect(xml).toContain("<loc>https://toban.app/templates/office-cleaning</loc>");
    expect(xml).toContain("<loc>https://toban.app/templates/school-lunch</loc>");
  });

  it("順番決めページ /junban を含む", async () => {
    const res = await handleSitemap("https://toban.app", envWithoutDb);
    const xml = await res.text();
    expect(xml).toContain("<loc>https://toban.app/junban</loc>");
  });
});

describe("renderJunbanHtml", () => {
  const origin = "https://toban.app";

  it("title/description/canonical と検索語彙（順番・ルーレット）を含む", () => {
    const html = renderJunbanHtml(origin);
    expect(html).toContain("<title>当番の順番をルーレット感覚で決める");
    expect(html).toContain('<link rel="canonical" href="https://toban.app/junban">');
    expect(html).toMatch(/順番/);
    expect(html).toMatch(/ルーレット/);
  });

  it("OGP/Twitter Card と FAQ 構造化データを含む", () => {
    const html = renderJunbanHtml(origin);
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('"@type":"FAQPage"');
  });

  it("円盤ビューへ着地する CTA（/?view=disc）を含む", () => {
    const html = renderJunbanHtml(origin);
    expect(html).toContain(`${origin}/?view=disc`);
  });

  it("ランダム抽選を約束せず、抽選ではない旨を明記する（intent ミスマッチ回避）", () => {
    const html = renderJunbanHtml(origin);
    expect(html).toMatch(/抽選とは異な|ランダムに当たりを引く抽選とは/);
  });

  it("JSON-LD ブロックに生の < を出さない（</script> ブレイク防止・defense-in-depth）", () => {
    const html = renderJunbanHtml(origin);
    const ld = html.slice(html.indexOf('application/ld+json">') + 21, html.indexOf("</script>"));
    expect(ld).not.toContain("<");
  });

  it("パンくず position1 は React 側と同じ「toban について」（bot/UI の構造化データ整合）", () => {
    const html = renderJunbanHtml(origin);
    expect(html).toContain('"name":"toban について"');
  });
});

describe("isKnownAppRoute", () => {
  it.each(["/", "/about", "/templates", "/templates/office-cleaning", "/s/abc_123-X", "/transfer", "/junban"])(
    "既知ルート %s は true",
    (path) => {
      expect(isKnownAppRoute(path)).toBe(true);
    },
  );

  it.each([
    "/templates/not-a-real-template", // 実在しない slug は soft-404 にしない
    "/foobar",
    "/about/extra",
    "/s/",
    "/404", // 404 ページ自体を bot に 200 で返すと自己矛盾するため未知扱い
  ])("未知ルート %s は false（bot へ 404 status を返す根拠）", (path) => {
    expect(isKnownAppRoute(path)).toBe(false);
  });
});

describe("renderTemplateDetailHtml related templates", () => {
  const origin = "https://toban.app";

  it("includes a section with related template links", () => {
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    expect(html).toContain("関連するテンプレート");
    expect(html).not.toMatch(/<a href="https:\/\/toban\.app\/templates\/office-cleaning"/);
  });

  it("emits up to 4 related template anchor tags inside the related section", () => {
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    const sectionMatch = html!.match(/<section>\s*<h2>関連するテンプレート<\/h2>[\s\S]*?<\/section>/);
    expect(sectionMatch).not.toBeNull();
    const anchorCount = (sectionMatch![0].match(/<a href="https:\/\/toban\.app\/templates\//g) || []).length;
    expect(anchorCount).toBeGreaterThan(0);
    expect(anchorCount).toBeLessThanOrEqual(4);
  });
});
