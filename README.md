# toban

学校・職場・家庭などの当番表を、登録不要で作成・印刷・共有できるアプリ。

**[toban.app を開く](https://toban.app)**

## データと共有

- 当番表は使っているブラウザに保存し、編集内容をサーバーにも自動バックアップします（共有を確定するまでは非公開）。ブラウザのデータを消すと、当番表や編集権限を失うことがあります。
- 共有を確定すると、リンクを知っている人が閲覧できます。名前などを公開してよいか確認してください。編集用リンクは編集権限も渡すため、信頼できる相手だけに渡してください。
- サーバー上の当番表は、365日間編集もカレンダーからの読み込みもないと自動削除されます。データの扱いは[プライバシーポリシー](https://toban.app/privacy)を参照してください。

## 開発を始める

Node.js 24 以上と Corepack を用意し、リポジトリ直下で実行します。pnpm のバージョンは `package.json` の指定に従います。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm db:migrate:local
corepack pnpm dev
```

通常は http://localhost:3000 で開けます（使用中なら起動ログの URL を確認）。
変更時のルール・検証・実装上の注意は [AGENTS.md](./AGENTS.md)、利用できるコマンドは [package.json](./package.json) を参照してください。

## 運用者が確認すること

- `main` へのマージは本番デプロイを起動します。手動デプロイ時は `CLOUDFLARE_D1_DATABASE_ID` を設定し、`pnpm build && pnpm run deploy:cf` を使います。DB 更新を含むため、`wrangler deploy` 単体では実行しないでください。
- WebMCP の現行 Origin Trial トークンは **2026-11-17 00:00 UTC** に失効します。継続利用する場合は期限前に [Chrome Origin Trials](https://developer.chrome.com/origintrials) を確認し、[client/index.html](./client/index.html) のトークンを更新してください。
- 収集情報や外部サービスを変えるときは、[プライバシーポリシー](./client/public/privacy.html) も更新してください。

## ライセンス

[MIT License](./LICENSE) — Copyright (c) 2026 hayashiii-ghub
