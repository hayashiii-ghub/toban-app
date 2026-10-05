import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

// アイコンの SVG ソース（client/public/favicon.svg・pwa-icon.svg）は
// Kiwi Maru Medium の「当」をパス化済み＝フォント非依存。ここでは各サイズの PNG を
// resvg でラスタライズするだけ。
//   字は地の 63% の大きさで、描かれた部分の外接矩形の中心を地の中心に合わせている。
//   地の色は manifest の theme_color（#2D4A3E）、字は LP の黒板の字（--lp-hero-text）
//   favicon.svg  = 角丸（ブラウザタブ）
//   pwa-icon.svg = 正方形（アプリ／PWA。角は OS が切り抜く）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(__dirname, "..", "client/public");

async function rasterize(srcSvg, outPng, size) {
  const svg = await readFile(path.resolve(pub, srcSvg), "utf8");
  const r = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  await writeFile(path.resolve(pub, outPng), r.render().asPng());
  console.log(`  ${outPng} (${size}x${size})`);
}

await rasterize("favicon.svg", "favicon-32.png", 32);
await rasterize("pwa-icon.svg", "apple-touch-icon.png", 180);
await rasterize("pwa-icon.svg", "pwa-192.png", 192);
await rasterize("pwa-icon.svg", "pwa-512.png", 512);
console.log(
  "Generated favicon-32 / apple-touch-icon / pwa-192 / pwa-512 from SVG sources"
);
