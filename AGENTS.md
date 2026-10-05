# AGENTS.md

toban を実装するときに守ること。コードを読めば分かることは書かない。人向けの説明は README。

## 検査

- pnpm が PATH に無いときは `corepack pnpm <cmd>`（ツールは `node_modules/.bin/<tool>` でも可）
- PR 前: `pnpm format:check && pnpm check && pnpm lint && pnpm test:coverage && pnpm build && pnpm test:e2e`
  - `pnpm check` は `e2e/` と直下の `*.config.ts` も型検査する
  - カバレッジの下限は `vite.config.ts`（行 70 / 分岐 60 / 関数 65 / 文 70）
- `pnpm dev` と e2e は Cloudflare の Vite プラグインで Worker ごと動く（手元の D1 は直下の `.wrangler/state`。`pnpm db:migrate:local` と共有）。e2e は vite を 3000 番で自前起動する。3000 番が塞がっていても止めない（利用者の dev サーバーのことがある）。一時設定でポートを変えて回す

## 配信とルーティング（壊れやすい所）

- `client/index.html` は SPA シェルで全ルートに配られる。ここの meta / JSON-LD は全ページに載る
- `/` はアプリ本体、LP は `/about`
- ビルドは D1 の ID を差し込んだ `wrangler.deploy.jsonc` を Vite プラグインに読ませ（`build` が先に `prepare-wrangler-config.mjs` を実行）、デプロイは出力の `dist/toban/wrangler.json` を使う。Vite の root が `client/` なので、プラグインの状態の置き場所と設定のパスは `vite.config.ts` で直下に向けている。PWA プラグインは client 環境だけで動かす
- ブラウザのページ遷移（`Sec-Fetch-Mode: navigate`）は、Cloudflare の `not_found_handling: single-page-application` により Worker を通らずに `index.html` が返る。Worker の分岐やヘッダーが効くのは bot と fetch だけ。転送は `client/public/_redirects`、ヘッダーは `client/public/_headers` に書く（Worker の `HTML_SECURITY_HEADERS` と揃える。`worker.test.ts` が見張る）（Service Worker が先に返さないよう `navigateFallbackDenylist` にも足す）
- bot は UA 判定で `/about` `/templates` `/templates/:slug` のプリレンダリングを受け取る（`server/handlers/seo.ts`）。`/` は対象外
- ルートを足したら `seo.ts` の `KNOWN_APP_ROUTES` にも足す。無いと bot に 404 を返す
- 利用者向けの静的ページ（今は `client/public/privacy.html`）は拡張子なしの URL で配られる。足すときは `KNOWN_APP_ROUTES` と `vite.config.ts` の `navigateFallbackDenylist` にも足す（無いと Service Worker が index.html で返し、SPA の 404 になる）
- `client/public/googlee79602eefe9a90c4.html` は Search Console の所有権確認。消さない・1 バイトも変えない
- `/api/` を workbox の `runtimeCaching` に載せない。古い 200 を同期の引き直しが最新として取り込み、ローカルの編集が巻き戻る（`swCache.test.ts` が見張る）

## データ

- 正本は localStorage。編集した当番表は、共有していなくても D1 に非公開で自動バックアップする（`useAutoSync`）。共有すると公開になる。1 年間更新が無く、カレンダーの購読（`/api/schedules/:slug/calendar.ics`）からも読まれていない行は cron で消す（`CLEANUP_RETENTION_DAYS`・`calendar_accessed_at`。i18n の `share.retention`・`shared.error.notFoundHint` と `client/public/privacy.html` の記述と揃える）
- 同期まわり（`hooks/useAutoSync.ts` / `lib/syncManager.ts` / `lib/api.ts`）の変更はデータ消失につながる。`*.recovery.test.*` を含む既存テストを必ず通す
- migration は `server/db/migrations/` に連番の SQL を手で書く（drizzle-kit は使わない。wrangler は `.sql` だけを読む）。既存のファイルは変えない。列を足したら `server/db/schema.ts` と `server/db/ensureSchema.ts` の `REQUIRED_SCHEDULE_COLUMNS` も揃える
- 外部に送る情報を増やす（解析ツール、新しい外部サービスなど）ときは `client/public/privacy.html` も直す

## 同じ値を持つ場所（1 か所だけ直すと食い違う）

- 入力の上限: `shared/limits.ts`（server のスキーマ、UI の maxLength、WebMCP の検証が共有）
- トップと LP の検索タイトル: `shared/site.ts` の `SITE_TITLE`。`client/index.html` の title / og:title / twitter:title は手書きで、`shared/seo-templates.test.ts` が一致を見張る
- toban を操作できる AI の名前: `shared/site.ts` の `AI_AGENTS`（LP・FAQ・bot 向け LP に差し込む）。実際に使えるものだけを書き、予定は書かない。LP の AI の節は `seo.ts` にも手書きしてあり、`seo.test.ts` が一致を見張る
- UI 文字列: `client/src/i18n/locales/ja.ts` がキーの正本（`MessageKey`）。`en.ts` と `t()` の引数は型でこれに縛られる。利用者が保存した名前・仕事は言語を切り替えても翻訳しない
- テンプレートは 32 件、LP は 31 件で正常（「カスタム（空白）」は LP を持たない）

## 置き場所

- 画面の機能コンポーネントは `client/src/features/<機能名>/`。`components/` は横断的に使うものだけ
- ホームの操作の帯（表示の切り替えを含む）と当番表のタブは、スマホでは画面の下にまとめて固定し（`Home.tsx` の `.home-bottom-panel`）、PC ではタイトルの下に置く。画面の下に何かを固定するときは `--home-toolbar-space`（`client/src/pages/home.css`）の分だけ持ち上げる（通知・アプリ追加の案内はそうしてある）。スマホのホームでは、ページの一番下の案内を出さず、言語の切り替えをタイトルの右上に、ほかの案内を編集画面の「くわしい設定」に置く。案内の項目は `components/siteLinks.tsx` の 1 か所で持つ
- テーマの字の色は、どの背景との組み合わせもコントラスト比 4.5（WCAG AA）以上にする（`designThemes.test.ts` が見張る）。読みにくい字を白い面や半透明でごまかさない。帯はどの色も深くして白い字にそろえ、帯の上の字は面を敷かずに直接置いている
- 並べ替えは HTML の drag and drop を使わない（スマホの指では動かない）。`hooks/usePointerDrag.ts` で、つまむ印（`touch-action: none`）から動かし、落とせる所に `data-drop-*` を付ける。指で動かす確認は `e2e/touch-gestures.spec.ts`（CDP で指の動きを送る）
- スマホで下から出る画面は、見出しを下になでて閉じられる（`hooks/useSheetSwipe.ts` と `SheetHandle`）。新しく作るシートにも付ける
- `client/src/rotation/` は React / DOM に依存させない（iOS 版で流用する予定）。型の import は可。`turns.ts`（誰がいつ何の当番か）はサーバーのカレンダー配信（`server/calendar.ts`）も読むので、`@/` の import やブラウザの API を入れない

## テストの書き方

- 対象の中核をモックしない。`react-qr-code` をモックしていて本番の共有モーダル障害を見逃し、`@/lib/storage` をモックして保存→読込の往復が一度も通っていなかった
- localStorage は `client/src/test/setup.ts` に実物同等のものがある。ネットワークは fetch の手前で差し替える
- framer-motion は本物を使う（setup でアニメーションを即時にし、`m` を `motion` に差し替えている）。フェードイン直後に `toBeVisible` を見るときは `waitFor`
- 日付を `toISOString()` で作らない（UTC になり、日本時間の 0〜9 時は前日）。`rotation/dateUtils.ts` の `formatIsoDateLocal` を使う。時差が絡むテストは `vi.stubEnv("TZ", "Asia/Tokyo")`
- e2e に `if (await x.isVisible())` のような分岐を書かない（要素が無いと黙って通る）

## WebMCP

- `client/src/hooks/useTobanTools.ts` は本番の機能。共有（公開）を実行する tool は持たない（誤発火で実名入りの表が公開されるのを防ぐ）
- tool の出力は 1,500 字以内の有効な JSON に分割する。利用者の入力を返す tool には `untrustedContentHint`、状態を変えない tool には `readOnlyHint`（`useTobanTools.contract.test.ts` が見張る）

## Git と PR

- main から 1 PR = 1 ブランチで切る。PR を積み重ねない（base のブランチが消えると上の PR が自動で閉じる）
- コミットと PR のタイトルは `feat:` / `fix:` / `refactor:` / `test:` / `chore:` / `docs:` などの接頭辞。PR の本文は `.github/pull_request_template.md` に沿って日本語で書く
- マージは squash。GitHub 側の head ブランチは自動で消える。手元はマージ後に消す:
  `git fetch -p && git branch -vv | awk '/: gone]/{print $1}' | xargs -n1 git branch -D`
- main へのマージで Workers Builds が本番へデプロイする。完了はマージコミットの check-run（`Workers Builds: toban`）で判定し、本番は実際に開いて確かめる
- CI の高速化は提案しない（定常で 2 分前後。軽量化は不要と判断済み）
