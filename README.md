# toban

学校・保育園・介護施設・自治会・オフィス・家庭の当番表を作成・印刷・共有できるアプリ。登録不要で、当番表はブラウザ（localStorage）に保存し、サーバー（Cloudflare D1）は共有とバックアップに使う。

**https://toban.app**

## セットアップ

Node.js >= 24 / pnpm >= 10。

```sh
corepack enable
pnpm install
pnpm dev          # 画面と Worker（API・bot 向けページ）を port 3000 で起動
```

## コマンド

```sh
pnpm dev          # 開発サーバー (port 3000)。Cloudflare の Vite プラグインで Worker も同じ環境で動く
pnpm build        # 本番ビルド（dist/client に画面、dist/toban に Worker）
pnpm check        # 型チェック
pnpm lint         # ESLint
pnpm format       # Prettier で整形
pnpm test         # ユニットテスト (Vitest)
pnpm test:e2e     # E2E テスト (Playwright)
pnpm db:migrate:local  # ローカル D1 に migration を適用
pnpm run deploy:cf     # migration 適用込みで Cloudflare へデプロイ
```

PR の前に通す検査は `.github/pull_request_template.md` のチェックリストのとおり（CI はこれに加えて E2E も実行する）。コードを書くときの約束ごとは [AGENTS.md](./AGENTS.md)。

## 構成

```
client/src/
  pages/        ルートごとのページ（/ がアプリ本体、/about が LP、/s/:slug が共有ページ）
  features/     画面の機能コンポーネント
  components/   モーダルなど横断的な部品
  hooks/        状態の集約（useHomeState）・自動同期（useAutoSync）・WebMCP（useTobanTools）
  lib/          API クライアント・同期
  rotation/     当番の計算・テーマ定義など（React / DOM に依存しない）
  i18n/         日本語・英語の UI 辞書
client/public/  静的ファイル（privacy.html・ads.txt・アイコンなど）
server/         Cloudflare Workers（Hono の API、bot 向けのプリレンダリング、D1）
shared/         フロントとサーバーで共有する型・上限・テンプレート・SEO データ
e2e/            Playwright
```

## デプロイと D1

- main へのマージで Cloudflare の Workers Builds が本番にデプロイする（ビルド `pnpm run build`、デプロイ `pnpm run deploy:cf`。PR のブランチはビルドしない設定）。手元から出すときは `CLOUDFLARE_D1_DATABASE_ID` を設定して `pnpm build && pnpm run deploy:cf`（本番 D1 に migration を適用してからデプロイする）
- `wrangler deploy` を単体で使わない。D1 の migration が適用されず、本番のスキーマが食い違うおそれがある
- `GET /api/health/schema` でスキーマの状態を確認できる（200: 正常 / 503: カラム不足）。サーバーは足りないカラムを自動で補うが、migration を先に当てるのが前提
- migration は `server/db/migrations/` に連番の SQL を手で足す（drizzle-kit は使わない）

Cloudflare 側で設定する環境変数:

| 変数                                | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `CLOUDFLARE_D1_DATABASE_ID`         | D1 データベースID                                  |
| `CLOUDFLARE_D1_PREVIEW_DATABASE_ID` | プレビュー用（任意）                               |
| `SLACK_WEBHOOK_URL`                 | お問い合わせのSlack通知用（`wrangler secret put`） |

## 人が対応すること

**WebMCP の Origin Trial は 2026-11-17 に切れる。** 期限が切れてもエラーにならず、無言で無効になる。近づいたら [Chrome Origin Trials](https://developer.chrome.com/origintrials) で再発行し、`client/index.html` の `<meta http-equiv="origin-trial">` のトークンを差し替える（対象は Chrome 149〜156、`https://toban.app` のみ。トークンは公開値で秘密ではない）。有効かどうかは、flag を切った通常の Chrome で `https://toban.app/` を開き、`document.modelContext ?? navigator.modelContext` があるかで見る。

**広告は AdSense の管理画面で決める。** コードに広告枠は無く、`client/index.html` の AdSense スクリプトによる自動広告だけ。アプリ本体（`/`）は自動広告の除外ページに入れ、本文に広告リンクを差し込む「広告インテント」はオフにしてある。印刷時は広告を隠す。`ads.txt` は `client/public/ads.txt`。

**プライバシーポリシーは `/privacy`（`client/public/privacy.html`）。** 集める情報や使う外部サービスが変わったら書き換える。

**CI:** GitHub Actions が push（main）と PR で整形・型・lint・テスト・ビルド・E2E を実行する。Lighthouse CI は毎週月曜 3:00 UTC と手動で計測する。

## WebMCP 対応（実験的）

AI エージェントがブラウザ上で当番表を作成・修正・印刷できるよう、[WebMCP](https://developer.chrome.com/docs/ai/webmcp) のツールを公開している（実装は `client/src/hooks/useTobanTools.ts`）。対応ブラウザでのみ有効になる。デモ動画（英語・2分）: https://youtu.be/4CSxh6WW51w

- 当番表の公開（共有）はツールから実行できない。誤って実名入りの表を公開しないよう、共有ボタンでの操作に限っている
- Cloudflare がダッシュボードで提供する同名の WebMCP 機能とは別物で、そちらは有効にしていない
- 手元で試すときは `chrome://flags/#enable-webmcp-testing` を有効にして `pnpm dev` を開き、WebMCP を呼べるクライアントから操作する

## ライセンス

[MIT License](./LICENSE)
