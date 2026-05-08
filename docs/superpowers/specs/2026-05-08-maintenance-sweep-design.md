# メンテナンススイープ — 壊れている CI / 廃止対応 / 溜まった Dependabot PR

**作成日:** 2026-05-08
**ステータス:** 承認済み（実装計画作成へ）

## 背景

`main` ブランチ保護を有効化した直後の棚卸しで、優先的に潰すべき「壊れている」「期限がある」項目が3つ見つかった。

- **Lighthouse CI** が 2026-04-06 から5週連続で毎週月曜失敗している（毎週 cron で動いているが誰も気づいていない状態）
- **GitHub Actions の Node.js 20 ランナー廃止** が 2026-06-02 強制移行。現在の workflow はすべて影響を受ける
- **Dependabot PR が 10 件溜まっている**（2026-04-05 から放置）。うち 9 件は CI 緑、1 件 (#27 react) は構成漏れで失敗中

## 目的

3 つを 1 セッションで片付け、`main` を「保護されていてかつ全 CI が緑な状態」にする。再発防止のため Dependabot のグループ化設定も入れる。

## スコープ外

- 大きいファイル分割（`LandingPage.tsx`, `TaskGroupEditor.tsx` 等）— 別セッションのリファクタ案件
- 直 push で e2e が走らない件 — 現状の運用と整合的なので変更しない
- CSP / セキュリティヘッダーの自動テスト追加 — 「あったら嬉しい」レベルで今回は対象外

---

## 設計

### 1. Lighthouse CI を vite preview 配信に切り替え

**問題:** `lighthouserc.json` で `staticDistDir: "./dist"` を使っており、SPA ルート (`/about`, `/templates`) に対するリクエストは静的ファイルとして見つからず 404 を返す。Lighthouse が "ERRORED_DOCUMENT_REQUEST (status code 404)" でクラッシュする。

**修正:**

- `lighthouserc.json` から `staticDistDir` を削除
- 代わりに `startServerCommand: "pnpm preview"` を追加
- `url` は完全修飾形式: `["http://localhost:4173/", "http://localhost:4173/about", "http://localhost:4173/templates"]`
- vite preview は SPA fallback (`historyApiFallback` 相当) を持つため、すべてのルートで `index.html` を返し 200 になる
- `.github/workflows/lighthouse.yml` の build step は維持（preview は `dist` を配信する）

**期待動作:** 翌週月曜の cron が緑になる。LP とテンプレ一覧のパフォーマンス回帰が検出される。

### 2. GitHub Actions のバージョン更新

**対象:**

- `.github/workflows/ci.yml` と `.github/workflows/lighthouse.yml` の両方
- `actions/checkout@v4` → `@v5`
- `actions/setup-node@v4` → `@v5`
- `pnpm/action-setup@v4` → `@v5`
- `treosh/lighthouse-ci-action@v12` は最新リリースを確認、Node 24 互換の最新版に上げる

**ピン留め方針:** メジャータグ (`@v5`) のまま。SHA ピンは Dependabot が更新できないので避ける。`dependabot.yml` に `package-ecosystem: github-actions` を追加して今後は自動 PR で追従する。

**期待動作:** Node.js 20 廃止警告が消える。2026-06-02 の強制移行で壊れない。

### 3. Dependabot PR triage + グループ化設定

**3-1. CI 緑の 9 PR を squash merge** (#21, #22, #23, #24, #25, #26, #28, #29, #30)

- すべて patch/minor で破壊的変更なし。CI 緑なので個別チェックは最小限
- マージ順: パッチ → マイナーの順。コンフリクトが出たら都度 rebase

**3-2. PR #27 (react + @types/react) は close → 再生成**

- 現状 `react` 19.2.4 + `react-dom` 19.2.1 のバージョン不整合で 16 テストが失敗（react-dom が同じグループに入っていなかったため）
- 対応: 元 PR を close。close 時にコメントで「react-dom 同時更新のため再発行」と残す
- 新しい `dependabot.yml` の group 設定により次回 cycle で react / react-dom / 型がまとめて 1 PR で出る

**3-3. `.github/dependabot.yml` に group 追加**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    groups:
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@types/react"
          - "@types/react-dom"
      dev-minor:
        dependency-type: "development"
        update-types: ["minor", "patch"]
      prod-minor:
        dependency-type: "production"
        update-types: ["minor", "patch"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
```

- メジャー版は意図的にグループ外（手動レビューしたい）
- `github-actions` ecosystem も追加し、Actions 廃止警告に自動で追従できるように

**期待動作:** 今後 Dependabot PR が週 1〜数件にまとまる。React 系のバージョン不整合事故が起きない。

---

## 実行順序

1. Lighthouse CI 修正 (`lighthouserc.json`) を `main` に直 push（小さな修正、ブランチ保護下でも force-push/削除以外は可能）
2. Actions バージョン更新（`ci.yml`, `lighthouse.yml`）も同 PR か別 PR で
3. `dependabot.yml` 更新を先に入れる（次の rebase で group 化が効くように）
4. Dependabot PR を `gh pr merge --squash` で順次 merge
5. PR #27 close → コメント残す → 来週の Dependabot cycle で react/react-dom が再発行されるのを待つ（or 手動 trigger）
6. 完了確認: `gh run list --branch main --limit 5` で全部緑、`gh pr list` が空

## 検証

- `gh run list --workflow lighthouse.yml --limit 3` が緑になる（次の月曜 cron 後）
- `gh run list --branch main --limit 10` で警告なし（Node.js 20 deprecation 消滅）
- `gh pr list --state open` が空 or 最新の Dependabot PR のみ
