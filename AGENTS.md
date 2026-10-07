# AGENTS.md

toban の変更時に守る作業指示。使い方は README、実装の詳細と可変の値はコードを参照する。この文書はユーザーの依頼・既存の承認範囲を広げない。

## 着手とブランチ管理

- 作業前に `git status`、`git worktree list`、最新の main、既存の PR とローカル・リモートのブランチを確認する。未コミット変更を上書き・破棄・無断で stash しない。他作業と重なる場合は独立した worktree を使う。
- 同じ目的の未完了 PR / ブランチがあれば、所有者と依頼範囲を確認して再利用する。継続中の依存更新は既存の Dependabot PR などを更新し、同じ依存・更新範囲の PR を重複作成しない。新規作成は既存作業で扱えない理由があるときだけ。
- 新規作業は最新 main から、1つの目的につき1つの短命ブランチ・PRにする。別 PR の head を base にして積み重ねない。継続作業を理由に用途の違う変更を同じブランチへ追加しない。
- ブランチ整理が承認範囲に含まれる場合、マージ後に対象 PR・取り込まれた head・残りの差分を確認し、その作業の不要な head ブランチを個別に整理する。GitHub 側の削除状態と `git worktree list` も確認する。
- 未マージ、他作業の所有、未 push の変更があるブランチや、変更の残る worktree は勝手に削除しない。古い未マージブランチは所有者と残す必要性を確認する。リモート追跡先が `gone` というだけで一括削除しない。squash 後に `git branch -d` が拒否しても、機械的に `-D` へ切り替えない。
- この手順を根拠に PR のマージ・クローズ、ブランチ削除、設定変更、デプロイを実行しない。個々の操作は依頼・承認の範囲に従う。

## 検証

- Node / pnpm は `package.json` の `engines` と `packageManager` に合わせ、依存は `pnpm install --frozen-lockfile` で入れる。pnpm が PATH に無ければ `corepack pnpm` を使う。
- コード・依存・設定を変更した PR の提出前は、`pnpm format:check && pnpm check && pnpm lint && pnpm test:coverage && pnpm build && pnpm test:e2e` を通す。型検査の対象は `tsconfig.json`、カバレッジ下限は `vite.config.ts` を正本とし、検査を通すために下げない。
- Markdown だけの変更は整形、記載したコマンド・パスと実装の照合、`git diff --check` と差分レビューを行う。どの変更でも最終コミットの CI を確認し、失敗や未実施の検査を隠さない。CI の高速化は依頼がない限り提案しない。
- `pnpm dev` / E2E は Vite と Worker を動かす。ローカル D1 は直下の `.wrangler/state` で、`pnpm db:migrate:local` と共有する。E2E はサーバーを自前起動するため、3000 番が使用中なら既存プロセスを止めず、一時設定で別ポートを使う。
- 検証対象の中核（保存・読込、QRコード、framer-motion など）をモックしない。`client/src/test/setup.ts` の localStorage・アニメーション設定を使い、ネットワークは fetch の境界で差し替える。必須要素の有無で E2E の検査をスキップしない。
- 日付だけを扱う処理は `rotation/dateUtils.ts` の `formatIsoDateLocal` を使う。`toISOString()` による UTC 変換で日付をずらさない。時差が関わるテストは `TZ` を指定する。

## Cloudflare / PWA の配信

- `/` はアプリ、`/about` は LP。`client/index.html` は全 SPA ルートと PWA の共通シェルなので、特定ページだけの meta・JSON-LD・スクリプトを置かない。
- 通常のブラウザ遷移は Cloudflare の SPA fallback により Worker を通らない場合がある。ブラウザ向けの転送は `client/public/_redirects`、ヘッダーは `client/public/_headers` に定義し、後者は Worker の `HTML_SECURITY_HEADERS` と揃える。Worker 側だけの修正で配信を直したと判断しない。
- ルートの追加・変更は `client/src/App.tsx` と `server/handlers/seo.ts` の既知ルート判定を揃える。bot 向けの `/about`・テンプレートのプリレンダリングは利用者向け本文と揃え、クローラー専用の内容を作らない。
- 静的ページ・転送ルートは `vite.config.ts` の `navigateFallbackDenylist` も確認する。拡張子なしで配る `privacy.html` などが PWA の `index.html` に置き換わらないようにする。配信・キャッシュ変更は直接アクセスと更新後の Service Worker 経由を検証する。
- `/api/` を Workbox の `runtimeCaching` に載せない。古い成功応答を同期が最新と誤認し、ローカル編集を巻き戻すため。
- `pnpm build` は D1 ID がある場合に `wrangler.deploy.jsonc` を生成してビルドする。`wrangler.jsonc` の ID プレースホルダーを実値で上書きしない。PWA は client 環境だけで生成し、承認されたデプロイでは出力の `dist/toban/wrangler.json` を使う。
- `client/public/googlee79602eefe9a90c4.html` は所有権確認用。内容を変更・削除しない。

## データと共有

- 当番表の正本は localStorage。D1 への自動バックアップは非公開で、共有操作により公開する。`useAutoSync` / `syncManager` / `api` の変更では `*.recovery.test.*` を含む保存・復旧の検証を通す。
- migration は `server/db/migrations/` に連番の SQL を追加し、既存ファイルを書き換えない（drizzle-kit は使わない）。列追加は `schema.ts` と `ensureSchema.ts` の `REQUIRED_SCHEDULE_COLUMNS` も揃える。
- 保存期限の変更は `CLEANUP_RETENTION_DAYS`・`calendar_accessed_at`、i18n の保持期限案内、`client/public/privacy.html` を揃える。外部送信する情報を増やす場合もプライバシー説明を更新する。
- `hooks/useTobanTools.ts` は本番機能。実名入りの表を誤公開しないよう公開 tool を追加しない。出力は1,500字以内の有効な JSON に分割し、利用者入力には `untrustedContentHint`、読み取り専用には `readOnlyHint` を付ける（契約テストを参照）。

## 実装の境界

- 画面固有の機能は `client/src/features/`、横断部品は `components/` に置く。`rotation/` は React / DOM に依存させない。サーバーからも読む `turns.ts` にブラウザ API や `@/` import を入れない。
- 入力上限は `shared/limits.ts`、サイトの共通文言は `shared/site.ts`、テンプレートと記事は `shared/` を正本にする。手書きのシェル・bot HTMLとの一致は関連テストで確認する。「カスタム（空白）」は記事を持たないので、テンプレートと記事の件数は一致しない。
- UI 文字列のキーは `i18n/locales/ja.ts` を正本にして `en.ts` も更新する。利用者が保存した名前・仕事は言語切替で翻訳しない。
- スマホの下部固定 UI は `--home-toolbar-space` を考慮する。案内リンクは `components/siteLinks.tsx`、並べ替えは `usePointerDrag`、シートの下スワイプは `useSheetSwipe` / `SheetHandle` を再利用する。HTML drag and drop に置き換えず、タッチ操作を検証する。
- テーマの文字と背景はコントラスト比4.5以上を保つ（`designThemes.test.ts`）。読みにくさを半透明や文字の背面への白い面追加でごまかさない。

## PR と完了報告

- コミット・PRタイトルは `fix:` / `docs:` などの接頭辞を付ける。本文は `.github/pull_request_template.md` に沿って日本語で、問題・変更後の動作・検証結果を書く。
- main へのマージは squash を使い、本番の Workers Builds を起動する操作として扱う。マージ・本番反映まで依頼された場合は、マージコミットの `Workers Builds: toban` と本番の動作を確認してから完了とする。
- 完了時は PR URL、コミット、変更の要点、実行した検査と CI の結果、残る制約を報告する。push・PR作成・マージ・デプロイのどこまで行ったか明記し、残したブランチ / worktree の場所と整理待ちの理由も伝える。
