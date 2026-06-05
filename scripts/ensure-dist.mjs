import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// dev:api / dev:full 用ガード。
// wrangler.jsonc の assets.directory が ./dist を参照しており、
// wrangler dev は起動時に dist/ の存在を検証する。
// クリーンクローンや dist/ 削除直後でも起動できるよう、
// dist/ が無いときだけ pnpm build を実行する（毎回フルビルドはしない）。

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distPath = path.resolve(projectRoot, "dist");

if (existsSync(distPath)) {
  process.exit(0);
}

console.log("[ensure-dist] dist/ が無いため pnpm build を実行します...");
const result = spawnSync("pnpm", ["build"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
