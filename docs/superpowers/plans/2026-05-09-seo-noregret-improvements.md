# toban SEO ノーリグレット改善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Twitter Card / OGP の整合化、`/og-image.png`（1200×630）参照への統一、bot 向けプリレンダー HTML への関連テンプレートリンク追加までを 1 PR で実装する。

**Architecture:** `server/handlers/seo.ts` に `buildSocialMetaTags` ヘルパーを新設し、4 つのレンダリング経路（`renderLandingPageHtml` / `renderTemplateListHtml` / `renderTemplateDetailHtml` / `handleScheduleOgp`）で再利用。`renderTemplateDetailHtml` には同カテゴリの関連テンプレートリンクを追加。`client/index.html` の OGP/Twitter タグを `/og-image.png` に統一。実画像はプレースホルダで仮置き、本デザインは別タスク。

**Tech Stack:** TypeScript / Vitest / Hono / Cloudflare Workers / React 19 / wouter

**Spec:** `docs/superpowers/specs/2026-05-09-seo-noregret-improvements-design.md`

---

### Task 1: `buildSocialMetaTags` ヘルパーを追加

**Files:**
- Modify: `server/handlers/seo.ts`
- Test: `server/handlers/seo.test.ts` (新規作成)

OGP/Twitter Card メタタグ群を組み立てるピュア関数を追加。後続のすべての render 関数 + handleScheduleOgp で再利用する。

- [ ] **Step 1: テストファイルを新規作成し、最初のテストを書く**

新規ファイル `server/handlers/seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildSocialMetaTags } from "./seo";

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
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: FAIL with `buildSocialMetaTags is not a function` または import エラー

- [ ] **Step 3: `server/handlers/seo.ts` に `buildSocialMetaTags` を実装**

`server/handlers/seo.ts` の `escapeHtml` 関数の直後（行 31 付近の後ろ）に以下を追加:

```ts
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
```

- [ ] **Step 4: テストを再実行して全てパスすることを確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: PASS（5 件すべて）

- [ ] **Step 5: コミット**

```bash
git add server/handlers/seo.ts server/handlers/seo.test.ts
git commit -m "feat(seo): buildSocialMetaTags ヘルパーを追加"
```

---

### Task 2: 3 つの静的 render 関数で `buildSocialMetaTags` を使う

**Files:**
- Modify: `server/handlers/seo.ts:120-164` (renderLandingPageHtml の `<head>` 内 OGP/Twitter ブロック)
- Modify: `server/handlers/seo.ts:195-225` (renderTemplateListHtml の `<head>` 内)
- Modify: `server/handlers/seo.ts:255-286` (renderTemplateDetailHtml の `<head>` 内)
- Test: `server/handlers/seo.test.ts`

各関数の `<head>` 内の OGP/Twitter メタタグ群を `buildSocialMetaTags` の呼び出しに置き換える。

- [ ] **Step 1: 各 render 関数に対する出力検証テストを追加**

`server/handlers/seo.test.ts` の末尾に追記:

```ts
import {
  renderLandingPageHtml,
  renderTemplateListHtml,
  renderTemplateDetailHtml,
} from "./seo";

describe("render functions emit consistent OGP/Twitter tags", () => {
  const origin = "https://toban.app";

  it("renderLandingPageHtml uses /og-image.png and twitter card", () => {
    const html = renderLandingPageHtml(origin);
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png">');
    // 旧 pwa-512 参照が残っていないこと（og:image 系のみ）
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
    // 既存の slug を使う：office-cleaning は seo-templates.ts に存在する
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    expect(html).toContain('<meta property="og:image" content="https://toban.app/og-image.png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://toban.app/og-image.png">');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: 既存の OGP 系アサーションがいくつか FAIL（pwa-512 を参照しているため、`/og-image.png` を期待する新テストが落ちる）

- [ ] **Step 3: `renderLandingPageHtml` のメタタグブロックを置換**

`server/handlers/seo.ts` の `renderLandingPageHtml` 内、現状の以下のブロック（行 128 付近〜行 140 付近）:

```ts
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${origin}/">
<meta property="og:type" content="website">
<meta property="og:image" content="${origin}/pwa-512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="toban">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${origin}/pwa-512.png">
```

を以下に置き換え（テンプレート文字列内の埋め込み式として）:

```ts
${buildSocialMetaTags({ title, description: desc, url: `${origin}/`, origin, type: "website" })}
```

- [ ] **Step 4: `renderTemplateListHtml` のメタタグブロックを置換**

`server/handlers/seo.ts` の `renderTemplateListHtml` 内、現状の以下のブロック（行 203 付近〜行 209 付近）:

```ts
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${origin}/templates">
<meta property="og:type" content="website">
<meta property="og:image" content="${origin}/pwa-512.png">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="toban">
```

を以下に置き換え:

```ts
${buildSocialMetaTags({ title, description: desc, url: `${origin}/templates`, origin, type: "website" })}
```

- [ ] **Step 5: `renderTemplateDetailHtml` のメタタグブロックを置換**

`server/handlers/seo.ts` の `renderTemplateDetailHtml` 内、現状の以下のブロック（行 263 付近〜行 269 付近）:

```ts
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(seo.description)}">
<meta property="og:url" content="${origin}/templates/${slug}">
<meta property="og:type" content="article">
<meta property="og:image" content="${origin}/pwa-512.png">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="toban">
```

を以下に置き換え:

```ts
${buildSocialMetaTags({ title: fullTitle, description: seo.description, url: `${origin}/templates/${slug}`, origin, type: "article" })}
```

- [ ] **Step 6: テストを再実行して全てパスすることを確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: PASS（全件）

- [ ] **Step 7: TypeScript 型チェック**

Run: `pnpm check`
Expected: エラーなし

- [ ] **Step 8: コミット**

```bash
git add server/handlers/seo.ts server/handlers/seo.test.ts
git commit -m "refactor(seo): 3 つの静的 render 関数を buildSocialMetaTags に統一"
```

---

### Task 3: `handleScheduleOgp` で `buildSocialMetaTags` を使う

**Files:**
- Modify: `server/handlers/seo.ts:35-79` (`handleScheduleOgp` 関数)

共有スケジュール `/s/:slug` の OGP に Twitter Card と og:image:width/height を追加し、og:image を `/og-image.png` に明示する。

- [ ] **Step 1: `handleScheduleOgp` の `ogTags` 配列を helper 呼び出しに置換**

`server/handlers/seo.ts` の `handleScheduleOgp` 内、現状の以下のブロック（行 64-69）:

```ts
const ogTags = [
  `<meta property="og:title" content="${title} - toban" />`,
  `<meta property="og:description" content="${description}" />`,
  `<meta property="og:url" content="${ogUrl}" />`,
  `<meta property="og:type" content="website" />`,
].join("\n    ");
```

を以下に置換:

```ts
const ogTags = buildSocialMetaTags({
  title: `${schedule.name} - toban`,
  description: `「${schedule.name}」の当番表`,
  url: url.href,
  origin: url.origin,
  type: "website",
});
```

注意: 既存コードでは `title` / `description` / `ogUrl` 変数が `escapeHtml` 適用済みの値だったが、`buildSocialMetaTags` は内部で `escapeHtml` するので、生の値（`schedule.name` / `url.href`）を渡す。`title` / `description` / `ogUrl` 変数は不要になるので削除する。

- [ ] **Step 2: 不要になったローカル変数を削除**

`handleScheduleOgp` 内の以下の行を削除（行 52-54）:

```ts
const title = escapeHtml(schedule.name);
const description = escapeHtml(`「${schedule.name}」の当番表`);
const ogUrl = escapeHtml(url.href);
```

ただし `<title>` 置換に `${title} - toban` を使っている箇所があれば、`escapeHtml(schedule.name)` をインライン展開する。具体的には行 60-62:

```ts
html = html.replace(
  /<title>[^<]*<\/title>/,
  `<title>${title} - toban</title>`,
);
```

を以下に変更:

```ts
html = html.replace(
  /<title>[^<]*<\/title>/,
  `<title>${escapeHtml(schedule.name)} - toban</title>`,
);
```

- [ ] **Step 3: 型チェックとテストを実行**

Run: `pnpm check && pnpm test server/handlers/seo.test.ts`
Expected: 型エラーなし、既存テスト全件 PASS

- [ ] **Step 4: コミット**

```bash
git add server/handlers/seo.ts
git commit -m "refactor(seo): handleScheduleOgp も buildSocialMetaTags を使う"
```

---

### Task 4: bot 向けプリレンダー HTML に関連テンプレートリンクを追加

**Files:**
- Modify: `server/handlers/seo.ts:227-286` (`renderTemplateDetailHtml`)
- Test: `server/handlers/seo.test.ts`

クローラ向けの HTML 出力にも、同カテゴリの他テンプレートへのリンクを 4 件まで追加する。React 側 `RelatedTemplates` と同等の選定ロジック（同カテゴリ → 不足分は他カテゴリ）。

- [ ] **Step 1: テストを追加**

`server/handlers/seo.test.ts` に追記:

```ts
describe("renderTemplateDetailHtml related templates", () => {
  const origin = "https://toban.app";

  it("includes a section with related template links", () => {
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    expect(html).toContain("関連するテンプレート");
    // 同じ slug 自身は含まれない
    expect(html).not.toMatch(/href="https:\/\/toban\.app\/templates\/office-cleaning"/);
  });

  it("emits up to 4 related template anchor tags inside the related section", () => {
    const html = renderTemplateDetailHtml(origin, "office-cleaning");
    expect(html).not.toBeNull();
    // <section> 内の <a href="/templates/..."> を抽出
    const sectionMatch = html!.match(/<section>\s*<h2>関連するテンプレート<\/h2>[\s\S]*?<\/section>/);
    expect(sectionMatch).not.toBeNull();
    const anchorCount = (sectionMatch![0].match(/<a href="https:\/\/toban\.app\/templates\//g) || []).length;
    expect(anchorCount).toBeGreaterThan(0);
    expect(anchorCount).toBeLessThanOrEqual(4);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: FAIL（「関連するテンプレート」が出力に含まれない）

- [ ] **Step 3: `renderTemplateDetailHtml` の本体に関連テンプレート HTML を組み立てる**

`server/handlers/seo.ts` の `renderTemplateDetailHtml` 内、`faqAndBreadcrumb` 定義の直後に以下を追加（行 253 付近の後ろ）:

```ts
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
```

- [ ] **Step 4: 出力 HTML の `<main>` 内、FAQ セクションの直前に挿入**

`renderTemplateDetailHtml` の return 文内、現状の以下の箇所（行 280-281）:

```ts
<a href="${origin}/?template=${seo.templateIndex}">このテンプレートで当番表を作る</a>
<h2>よくある質問</h2>
```

を以下に変更:

```ts
<a href="${origin}/?template=${seo.templateIndex}">このテンプレートで当番表を作る</a>
${relatedHtml}
<h2>よくある質問</h2>
```

- [ ] **Step 5: テストを再実行して PASS することを確認**

Run: `pnpm test server/handlers/seo.test.ts`
Expected: PASS（全件）

- [ ] **Step 6: 型チェック**

Run: `pnpm check`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add server/handlers/seo.ts server/handlers/seo.test.ts
git commit -m "feat(seo): bot 向け HTML に関連テンプレートリンクを追加"
```

---

### Task 5: `client/index.html` の OGP/Twitter 参照を更新

**Files:**
- Modify: `client/index.html`

実ユーザーが SPA を直接読み込む場合の初期 HTML、および bot プリレンダーに該当しないルート（例: ホーム `/` の bot 以外）の OGP も統一する。

- [ ] **Step 1: `client/index.html` の OGP/Twitter ブロックを 1200×630 / `/og-image.png` に置換**

`client/index.html` の `<head>` 内、現状の以下のブロック（行 14-29 付近）:

```html
<!-- OGP -->
<meta property="og:title" content="toban（トバン）｜無料で当番表を作成・印刷・共有" />
<meta property="og:description" content="掃除当番・給食当番・日直などのローテーション表を無料で簡単に作成・印刷・共有。登録不要ですぐ使えます。" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://toban.app/" />
<meta property="og:image" content="https://toban.app/pwa-512.png" />
<meta property="og:image:width" content="512" />
<meta property="og:image:height" content="512" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:site_name" content="toban" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="toban（トバン）｜無料で当番表を作成・印刷・共有" />
<meta name="twitter:description" content="掃除当番・給食当番・日直などのローテーション表を無料で簡単に作成・印刷・共有。登録不要ですぐ使えます。" />
<meta name="twitter:image" content="https://toban.app/pwa-512.png" />
```

を以下に置き換える（og:image / twitter:image を `/og-image.png` に、og:image:width/height を 1200/630 に）:

```html
<!-- OGP -->
<meta property="og:title" content="toban（トバン）｜無料で当番表を作成・印刷・共有" />
<meta property="og:description" content="掃除当番・給食当番・日直などのローテーション表を無料で簡単に作成・印刷・共有。登録不要ですぐ使えます。" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://toban.app/" />
<meta property="og:image" content="https://toban.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:site_name" content="toban" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="toban（トバン）｜無料で当番表を作成・印刷・共有" />
<meta name="twitter:description" content="掃除当番・給食当番・日直などのローテーション表を無料で簡単に作成・印刷・共有。登録不要ですぐ使えます。" />
<meta name="twitter:image" content="https://toban.app/og-image.png" />
```

注意: `<script type="application/ld+json">` 内の `"image": "https://toban.app/pwa-512.png"`（行 41 付近）と `"screenshot": "https://toban.app/pwa-512.png"`（行 60 付近）は WebApplication schema のアイコン用なので、**そのまま PWA アイコンを参照し続ける**（ロゴ/アイコン用途と OG 画像は別物）。変更不要。

- [ ] **Step 2: 型チェック（HTML 変更だが念のため build を通す）**

Run: `pnpm build`
Expected: ビルド成功

- [ ] **Step 3: コミット**

```bash
git add client/index.html
git commit -m "chore(seo): index.html の og:image / twitter:image を /og-image.png 1200x630 に統一"
```

---

### Task 6: `og-image.png` プレースホルダを配置

**Files:**
- Create: `client/public/og-image.png`

実画像のデザイン制作とは独立に、参照先が 404 にならないようにプレースホルダを配置する。実デザインへの差し替えは別タスク（spec の Section 2 参照）。

- [ ] **Step 1: 既存の pwa-512.png を og-image.png として複製**

```bash
cp client/public/pwa-512.png client/public/og-image.png
```

注意: このプレースホルダは 512×512 で、`og:image:width/height` で宣言した 1200×630 と一致しない。OGP 取得側はメタタグの宣言値を上書きして実画像のサイズで判定するので、Twitter / LINE / Slack でのクロップ挙動は実画像と同じ（正方形）になる。これは「壊れない」プレースホルダであり、デザイン差し替え後に正規の見栄えになる。

- [ ] **Step 2: 配置確認**

Run: `ls -la client/public/og-image.png`
Expected: ファイルが存在する

- [ ] **Step 3: コミット**

```bash
git add client/public/og-image.png
git commit -m "chore(assets): og-image.png のプレースホルダを配置（実デザイン差し替え予定）"
```

---

### Task 7: 全体テスト + 手動検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 全テスト実行**

Run: `pnpm test`
Expected: 全件 PASS、新規 seo.test.ts のすべてのテストが通る

- [ ] **Step 2: 型チェック + Lint**

Run: `pnpm check && pnpm lint`
Expected: 両方ともエラーなし

- [ ] **Step 3: ビルド検証**

Run: `pnpm build`
Expected: ビルド成功、`dist/` に成果物が出力される。`dist/og-image.png` が存在する

- [ ] **Step 4: ローカル dev で OGP 出力を目視確認**

```bash
pnpm dev:full
```

別ターミナルで:

```bash
# bot UA でテンプレート詳細を取得
curl -A "Twitterbot/1.0" -s http://localhost:8788/templates/office-cleaning | grep -E 'og:image|twitter:|関連するテンプレート' | head -20
```

Expected: `og:image` が `/og-image.png`、`og:image:width="1200"`、`twitter:card="summary_large_image"`、`関連するテンプレート` セクションが含まれる

- [ ] **Step 5: 共有 URL の OGP も確認（任意、DB 必要）**

ローカルで共有 URL を 1 つ作ってから:

```bash
curl -A "Twitterbot/1.0" -s 'http://localhost:8788/s/<slug>' | grep -E 'og:image|twitter:' | head -10
```

Expected: og:image が `/og-image.png`、twitter:card メタタグも出力される

- [ ] **Step 6: ステージング相当（preview）での最終確認**

Run: `pnpm preview` で `pnpm build` 成果物を vite preview で配信し、ブラウザで `/templates/office-cleaning` を開いて View Source で `<meta>` 確認。

- [ ] **Step 7: README に spec / plan へのリンクを追記（任意）**

README.md に SEO 改善の経緯がわかるよう一文追加するか判断。プロジェクト方針「コードや構成を変更した場合は README.md も合わせて更新すること」に該当する範囲なら更新。具体的には README.md の「主な機能」セクション以降に SEO 関連の言及があれば差分を最小限で反映。

- [ ] **Step 8: PR 作成 or main へ直 push を判断**

過去パターン（このリポジトリでは小規模変更は main 直 push、依存変更は PR 経由）に従う。今回は機能追加 + テスト新設なので PR 推奨だが、ユーザーの指示に従う。

---

### Task 8: 本番デプロイ後の検証（マージ後実施）

**Files:** なし

本番反映後に外部 OGP デバッガで実プレビューを確認する。

- [ ] **Step 1: https://opengraph.dev/ で `https://toban.app/` を検証**

Expected: 1200×630 のプレビューが表示され、警告なし（プレースホルダ使用中は画像が小さいが、参照は正しい）

- [ ] **Step 2: https://opengraph.dev/ で `https://toban.app/templates/office-cleaning` を検証**

Expected: テンプレート個別の title/description、`og:type=article`、Twitter Card が summary_large_image

- [ ] **Step 3: Facebook Sharing Debugger で再スクレイプ**

URL: https://developers.facebook.com/tools/debug/

`https://toban.app/` を入力し「Scrape Again」。新しい OGP が反映されるまで実施。

- [ ] **Step 4: LINE で実機確認**

LINE のトークに `https://toban.app/templates/office-cleaning` を貼り、プレビューカードに正しいタイトル/説明が表示されることを確認。

- [ ] **Step 5: Google Rich Results Test で構造化データ確認**

URL: https://search.google.com/test/rich-results

`https://toban.app/templates/office-cleaning` を入力、`BreadcrumbList` と `FAQPage` が引き続きエラーなく検出されることを確認。

- [ ] **Step 6: GSC を観察して追加施策を別 spec として起票**

spec の Section 4 に従い、過去 28 日のクエリ別 / ページ別 / インデックス状況を確認。データを Claude に共有して、次の改善 spec を起票するかを判断。

---

## やらないこと（このプランの範囲外）

- og-image.png の本デザイン制作（プレースホルダのまま、別タスクで差し替え）
- テンプレート別 OGP 画像の build-time 生成（GSC データ次第で別 spec 起票）
- React 側 `RelatedTemplates` の改修（既存実装で十分）
- ブログ / 記事コンテンツの追加
- カテゴリ別 LP 新設

## 完了条件

- [x] spec のすべての要件にタスクが対応している（spec の Section 1, 2, 3-2, 4 すべて）
- すべてのタスクのチェックボックスが完了
- 新規 `server/handlers/seo.test.ts` のテストが全件 PASS
- `pnpm test && pnpm check && pnpm lint && pnpm build` が成功
- 本番デプロイ後、opengraph.dev で警告ゼロ
