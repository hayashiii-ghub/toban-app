# design-sync notes — toban-app

## このリポジトリは「アプリ」であって DS パッケージではない
- toban-app は Vite アプリ（`package.json` に `main`/`module`/`exports` なし、`dist/` はアプリ出力）。design-sync の変換器が対象にしているのは**アプリ本体ではなく**、手作りのプレゼンテーショナル・キット `/.design-sync/kit/`。
- キットは store / router / i18n 非依存で、`client/src/index.css` の `--dt-*` トークンと `client/src/rotation/designThemes.ts` の9テーマを**手で写したミラー**。
- 取り込み対象は7コンポーネント: ColorTokens / Typography / ThemeSwatches / RotationTable / Modal / Button / StateCard。

## ビルド
- `buildCmd`: `npm --prefix .design-sync/kit run build`（tsc で `.d.ts` + esbuild で `dist/index.es.js`）。
- 変換器の起動:
  ```
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules .design-sync/kit/node_modules \
    --entry .design-sync/kit/dist/index.es.js --out ./ds-bundle
  ```
- `--node-modules` はキットの node_modules（react 19 をここで解決）。`cssEntry` は `src/tokens.css`（キット相対）。

## Known render warns（既知・トリアージ済み）
- `[RENDER_ERRORS] StateCard` の ErrorState セル: pageerror 1件は**誤検知**。カードは正しく描画され（root 非空、`[RENDER]` 未発火）、視覚も完璧。アンバー⚠️のエラー画面表示が原因テキストを拾われているだけ。非ブロッキング。
- `[FONT_REMOTE] "M PLUS Rounded 1c"`: Google Fonts の `@import` で実行時配信。ローカル同梱しない方針なので action 不要。

## Re-sync risks（次回が静かに古くなりうる点）
- キットは `client/src/index.css` と `designThemes.ts` の**手動ミラー**。アプリ側でトークン／テーマ値を変えたら、`.design-sync/kit/src/tokens.css`・`ColorTokens.tsx`・`ThemeSwatches.tsx` を手で追従させること（自動同期はされない）。
- 当番表の見た目（`RotationTable.tsx`）も実アプリの `RotationQuickTable` の簡略再現。現在列ハイライトの作法が変わったら追従。
