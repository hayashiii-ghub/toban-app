## Cursor Cloud specific instructions

### Environment
- **Node.js >= 24** が必要。nvm を使ってインストール: `nvm install 24 && nvm use 24`
- **pnpm >= 10** が必要。Node 24 にインストール: `npm install -g pnpm@10.29.1`
- PATH に Node 24 のバイナリを優先させる: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`

### コマンド一覧
README.md の「コマンド」セクションを参照。主要コマンド:
- `pnpm dev` — Vite 開発サーバー (port 3000)
- `pnpm dev:full` — フロント + API 同時起動
- `pnpm lint` — ESLint
- `pnpm check` — TypeScript 型チェック
- `pnpm test` — ユニットテスト (Vitest)
- `pnpm test:e2e` — E2Eテスト (Playwright, Chromium)
- `pnpm build` — 本番ビルド

### 注意点
- Playwright の `npx playwright install --with-deps chromium` は環境によってタイムアウトすることがある。その場合はChromium zipを手動でダウンロード・展開する必要がある (`chromium-1217` と `chromium_headless_shell-1217` の両方が `~/.cache/ms-playwright/` に必要)
- `localStorage` が主データストア。APIサーバー (`pnpm dev:api`) なしでもフロントエンドは単独で動作する
- E2Eテストは Vite 開発サーバーのみに依存し、APIサーバーは不要 (`reuseExistingServer: true` のため既にポート3000で稼働中なら自動で再利用)
- `pnpm.onlyBuiltDependencies` が `package.json` で設定済みのため `pnpm approve-builds` は不要
