import { describe, it, expect } from "vitest";
import {
  buildSocialMetaTags,
  renderLandingPageHtml,
  renderTemplateListHtml,
  renderTemplateDetailHtml,
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
