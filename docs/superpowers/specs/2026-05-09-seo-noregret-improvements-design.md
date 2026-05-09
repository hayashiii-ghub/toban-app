# toban SEO ノーリグレット改善 + GSC 診断ガイド

**日付**: 2026-05-09
**対象**: 集客・認知の伸長（オーガニック検索流入 / 共有 URL の OGP プレビュー）

## 背景

過去 30 日の Cloudflare 計測結果:

- HTTP リクエスト 16.7k のうち 99% が bot（CF が大半をキャッシュで吸収）
- Web Analytics（bot 除外）の実 PV は 200 / 月、ユニーク 200
- Core Web Vitals は LCP/INP/CLS 全て緑（P75 LCP 1.31s）
- 共有 URL `/s/...` が実際にクリックされている形跡（プロダクトの core loop は動いている）

品質は十分耐えており、ボトルネックは **認知・流入規模**。GSC は導入済みだが未確認。

## 方針

「データを見るまでもなく明確に劣化している部分」をノーリグレットで先に直し、並行して GSC を観察して追加施策を判定する。

## 既存資産の確認結果

`server/worker.ts` と `server/handlers/seo.ts` を確認したところ、想定より SEO 基盤は整っている:

- ✅ UA ベースの動的レンダリング (`isBot()` で Twitter/LINE/Slack/Discord/Facebook/LinkedIn/Apple/Google/Bing を網羅)
- ✅ 各テンプレート個別ページの動的 title/description/canonical/og:title/og:description/og:url
- ✅ BreadcrumbList + FAQPage JSON-LD（テンプレート詳細）
- ✅ FAQPage JSON-LD（一覧・詳細）
- ✅ 動的 sitemap（公開共有スケジュールも含む）
- ✅ WebApplication schema（landing）

## 実際の弱点（今回の修正対象）

1. **OGP 画像が `/pwa-512.png`（512×512 正方形）で全ページ共通**
   - Twitter Card は `summary_large_image`（1200×630 を期待）を指定しているが画像サイズが不一致
   - LINE/Slack/Discord/Twitter で プレビューがクロップされたり small card にフォールバック
   - 共有 URL `/s/:slug` も `handleScheduleOgp` が og:image を明示せず index.html を相続するため同じ問題
2. **Twitter Card メタタグが `/templates` と `/templates/:slug` のプリレンダー HTML に欠けている**（`/about` のみ実装済み）
3. **`og:image:width/height` が landing にしかなく、しかも値が 512/512**
4. **bot 向けプリレンダー HTML（`renderTemplateDetailHtml`）に「関連テンプレート」リンクが無い** — 内部リンク密度がクローラ目線で薄い（React 側の `TemplateDetailPage.tsx` には `RelatedTemplates` コンポーネントが既に実装済み）

## 設計

### Section 1: 既存プリレンダー HTML の Twitter Card / OGP サイズ整合

**変更対象**: `server/handlers/seo.ts`

**1-1. Twitter Card 補完**

`renderTemplateListHtml`（行 195 以降）と `renderTemplateDetailHtml`（行 255 以降）の `<head>` 内に以下を追加:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${origin}/og-image.png">
```

**1-2. og:image サイズ整合**

全 render 関数（`renderLandingPageHtml`, `renderTemplateListHtml`, `renderTemplateDetailHtml`）の `og:image` 宣言を以下に統一:

```html
<meta property="og:image" content="${origin}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

**1-3. handleScheduleOgp の og:image 明示**

`handleScheduleOgp`（行 35-79）の `ogTags` 配列に `og:image` を追加:

```ts
const ogTags = [
  `<meta property="og:title" content="${title} - toban" />`,
  `<meta property="og:description" content="${description}" />`,
  `<meta property="og:url" content="${ogUrl}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:image" content="${url.origin}/og-image.png" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:image" content="${url.origin}/og-image.png" />`,
].join("\n    ");
```

これで index.html 由来の pwa-512.png 相続を上書きする。

**1-4. client/index.html の og:image 同期**

`client/index.html` の og:image 系も新画像に揃える:

```html
<meta property="og:image" content="https://toban.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="https://toban.app/og-image.png" />
```

### Section 2: 1200×630 OGP 画像の作成

**目標**: ブランドに合った 1200×630 PNG を 1 枚作成

**ファイル**: `client/public/og-image.png`

**作成方法**: ユーザー側で Figma / 画像エディタで作成。または別タスクで Node スクリプト（`satori` + `@resvg/resvg-js`）による生成を行う。本 spec の実装タスクには **画像ファイルの存在を前提とした参照差し替え** までを含め、PNG 自体の作成は分離する。

**デザイン要件**:
- サイズ: 1200×630
- 背景色: クリーム `#FFF8E7` または ダークグリーン `#2D4A3E`（コントラスト要検討）
- ロゴ: 「toban」ワードマーク（既存 favicon.svg のスタイルに合わせる）
- サブコピー: 「当番表をかんたんに」または「無料で作成・印刷・共有」
- 雰囲気: 「掲示物として印刷される品質を売る」プロダクトに合わせて、こくばん / クレヨン / クラフト紙のような質感を匂わせる
- フォーマット: PNG（透過不要）、目安 100-200KB

**Phase B（今回スコープ外、GSC データ次第で判断）**:
- テンプレート別 OGP（32 枚を build 時生成）
- 実装は `satori` + `@resvg/resvg-js` で生成スクリプト → `client/public/og/<slug>.png`
- GSC で「テンプレート個別ページが検索結果でクリックされている」と確認できたら投資する

### Section 3: 関連テンプレートモジュール（bot 向けプリレンダーのみ）

**3-1. 実ユーザー向け（React コンポーネント）— 既に実装済み**

`client/src/pages/TemplateDetailPage.tsx` の `RelatedTemplates`（行 188-215）が既に同カテゴリ + 別カテゴリの組み合わせで 4 件まで表示する実装になっている。今回は触らない。

**3-2. bot 向けプリレンダー HTML**

**変更対象**: `server/handlers/seo.ts` の `renderTemplateDetailHtml`

`<main>` 末尾に同カテゴリの関連テンプレートリンクリストを追加:

```ts
const relatedTemplates = TEMPLATE_SEO_DATA
  .filter((t) => t.categoryId === seo.categoryId && t.slug !== slug)
  .slice(0, 4);

const relatedHtml = relatedTemplates.length > 0
  ? `<section><h2>同カテゴリの他のテンプレート</h2><ul>${relatedTemplates
      .map((t) => `<li><a href="${origin}/templates/${t.slug}">${escapeHtml(t.heading)}</a></li>`)
      .join("")}</ul></section>`
  : "";
```

これを既存 `<main>` 内の FAQ セクション直前に挿入。

### Section 4: GSC 観察ガイド（コード変更なし、ドキュメントのみ）

ノーリグレット施策の実装と並行して、Search Console を観察して追加施策の優先順位を決める。

**確認すべきビュー**

1. **検索パフォーマンス → クエリ別**（過去 28 日）
   - 「平均掲載順位 5-15位」かつ「CTR < 5%」のクエリ
     → タイトル/メタ改善で勝てる候補
   - 表示回数が多いがクリック 0 のクエリ
     → 検索意図とのミスマッチを疑う
2. **検索パフォーマンス → ページ別**（過去 28 日）
   - 表示回数 / クリックの上位ページ
   - テンプレート個別ページが入っているか、Home (/) しか表示されていないか
     → 入っていなければ SPA 起因のインデックス遅延を疑う
3. **ページのインデックス登録**
   - 32 個のテンプレート個別 URL がすべて「ページがインデックスに登録されています」になっているか
   - 「クロール済み - インデックス未登録」になっている URL の有無
4. **拡張機能 → 構造化データ**
   - WebApplication / FAQPage / BreadcrumbList のエラー / 警告

**データ共有方法**

GSC 画面のスクリーンショット、または「エクスポート」ボタンから CSV をダウンロードして Claude に貼り付け。クエリ別 / ページ別の Top 30-50 行があれば十分。

**観察結果から分岐する打ち手の候補（GSC データを見てから決める）**

| GSC で見えた状況 | 候補施策 |
|---|---|
| 順位 5-15 位の高ボリュームクエリ多数 | タイトル / description のコピー最適化 |
| テンプレート個別ページが検索結果に出ない | プリレンダー出力の HTML 検証、内部リンク強化 |
| インデックス未登録ページあり | sitemap への明示、内部リンク追加、`Disallow` 確認 |
| 個別ページがクリックされている | テンプレート別 OGP 画像生成（Phase B 起動） |
| 同カテゴリ内競合あり | カテゴリ別 LP 新設 |
| 検索結果が少ない / 全体的に弱い | 記事コンテンツ追加（ブログ / 用語集） |

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `server/handlers/seo.ts` | Twitter Card 補完、og:image 統一、handleScheduleOgp の og:image 明示、関連テンプレート HTML |
| `client/index.html` | og:image / twitter:image を新画像に差し替え |
| `client/public/og-image.png` | 新規ファイル（1200×630 PNG、初期はプレースホルダ可） |

## テスト戦略

- **単体テスト**: `seo.ts` の render 関数に対し、新画像 URL と Twitter Card タグが含まれることを `vitest` で検証
- **E2E**: `playwright` で `/templates/office-cleaning` にアクセスし、関連テンプレートセクションが表示されること、リンクが機能することを確認
- **手動検証**:
  - https://opengraph.dev/ または https://www.opengraph.xyz/ で OGP プレビュー確認（Twitter Card Validator は 2024 年に廃止）
  - Facebook Sharing Debugger（https://developers.facebook.com/tools/debug/）で OGP 確認
  - LINE で実際に共有 URL を送ってプレビュー確認
  - Google Rich Results Test（https://search.google.com/test/rich-results）で BreadcrumbList と FAQPage が引き続き有効か確認

## ロールアウト

1. ノーリグレット施策（Section 1〜3）を 1 PR で実装
2. デプロイ後、上記の手動検証を実施
3. GSC を観察し（Section 4）、データを Claude と共有して追加施策を別 spec として起票
4. テンプレート別 OGP（Phase B）など追加施策が決まれば次のサイクルへ

## やらないこと

- AdSense 関連の最適化（既存の placeholder のまま）
- ブログ / 記事コンテンツの追加（GSC でコンテンツ不足が判明したら別 spec）
- 新規ページタイプの追加（カテゴリ別 LP など）
- Web Analytics 以外の計測ツール導入（GA4 等）
- 既存 BreadcrumbList / FAQPage の構造拡張（既存実装で十分）
- React Helmet 等のメタタグ管理ライブラリ導入（既存の bot 別レンダリングで十分機能している）

## 成功指標

ノーリグレット施策の効果は以下で測る（実装後 2-4 週間で評価）:

- 共有 URL を踏んだ際の OGP プレビューが 1200×630 で正しく表示される（手動検証）
- Twitter Card Validator / Facebook Sharing Debugger で警告ゼロ
- GSC のクリック数 / 表示回数の前月比増加（少なくとも横ばい以上）
- テンプレート詳細ページの直帰率の改善（関連テンプレートクリック発生）

GSC 起点の追加施策については、データを見て個別に成功指標を設定する。
