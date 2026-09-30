import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, "client/public/og-image.png");

// ブランドフェイスは Kiwi Maru（やわらかい明朝系・300/400/500 のみ）。
// resvg はシステムフォント依存のため、Kiwi Maru を確実に描画できるよう
// フォントファイルを明示ロードする。リポジトリには含めず（軽量優先）、
// 無ければ Google Fonts から取得して scripts/fonts/ にキャッシュする。
const fontDir = path.resolve(__dirname, "fonts");
const fontPath = path.resolve(fontDir, "KiwiMaru-Medium.ttf");
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/kiwimaru/KiwiMaru-Medium.ttf";

async function ensureFont() {
  try {
    await access(fontPath);
  } catch {
    await mkdir(fontDir, { recursive: true });
    const res = await fetch(FONT_URL);
    if (!res.ok)
      throw new Error(`Kiwi Maru font download failed: ${res.status}`);
    await writeFile(fontPath, Buffer.from(await res.arrayBuffer()));
    console.log(
      "Downloaded Kiwi Maru Medium to scripts/fonts/ (cached, gitignored)"
    );
  }
}

await ensureFont();

// 1200x630 OGP image. LP（/about）のヒーローと同じ、黒板の地に紙の当番表を貼った絵柄。
// 色は index.css の --lp-*、見本の当番表は features/landing/HeroRosterMock.tsx と同じ中身。
// Kiwi Maru は太字がないため weight は 500（Medium）で統一。
// resvg は絵文字の画像を描けないので、見本の当番表に絵文字は使わない。
const FF = "'Kiwi Maru','Hiragino Sans','Yu Gothic',serif";
const C = {
  board: "#294A3A",
  wood: "#6B4A2E",
  chalk: "#F3EEDF",
  chalkSub: "#BFD2C4",
  paper: "#FBFAF4",
  line: "#DCD2C2",
  text: "#2A3A30",
  textSub: "#4A6050",
  highlight: "#E7D08A",
};
// MEMBER_PRESETS（shared/appearance.ts）の青・緑・橙・紫
const rows = [
  {
    task: "床そうじ",
    member: "佐藤",
    color: "#3B82F6",
    bg: "#DBEAFE",
    fg: "#1E3A5F",
  },
  {
    task: "ゴミ出し",
    member: "鈴木",
    color: "#10B981",
    bg: "#D1FAE5",
    fg: "#064E3B",
  },
  {
    task: "給湯室",
    member: "高橋",
    color: "#F97316",
    bg: "#FED7AA",
    fg: "#7C2D12",
  },
  {
    task: "窓ふき",
    member: "田中",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    fg: "#4C1D95",
  },
];
const rowSvg = rows
  .map((r, i) => {
    const y = 250 + i * 70;
    return `
    <rect x="712" y="${y}" width="396" height="58" rx="10" fill="#FFFFFF" stroke="${C.line}" stroke-width="1.5"/>
    <circle cx="740" cy="${y + 29}" r="7" fill="${r.color}"/>
    <text x="762" y="${y + 37}" font-family="${FF}" font-weight="500" font-size="24" fill="${C.textSub}">${r.task}</text>
    <rect x="994" y="${y + 11}" width="96" height="36" rx="18" fill="${r.bg}" stroke="${r.color}" stroke-width="2"/>
    <text x="1042" y="${y + 37}" text-anchor="middle" font-family="${FF}" font-weight="500" font-size="22" fill="${r.fg}">${r.member}</text>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="smudge1" cx="0.15" cy="0.2" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="smudge2" cx="0.85" cy="0.85" r="0.55">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="shadowSm" x="-20%" y="-40%" width="140%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- 黒板と、下の木の縁 -->
  <rect width="1200" height="630" fill="${C.board}"/>
  <rect width="1200" height="630" fill="url(#smudge1)"/>
  <rect width="1200" height="630" fill="url(#smudge2)"/>
  <rect y="610" width="1200" height="20" fill="${C.wood}"/>

  <!-- 左：言葉 -->
  <rect x="80" y="92" width="252" height="48" rx="24" fill="${C.highlight}"/>
  <text x="206" y="125" text-anchor="middle" font-family="${FF}" font-weight="500" font-size="24" fill="${C.board}">登録不要・完全無料</text>

  <text x="80" y="254" font-family="${FF}" font-weight="500" font-size="72" fill="${C.chalk}">当番表、</text>
  <text x="80" y="350" font-family="${FF}" font-weight="500" font-size="72" fill="${C.chalk}">すぐに完成。</text>
  <path d="M84 372 C 190 358, 350 380, 492 364" fill="none" stroke="${C.highlight}" stroke-width="8" stroke-linecap="round"/>

  <text x="80" y="446" font-family="${FF}" font-weight="500" font-size="32" fill="${C.chalkSub}">名前を入れるだけでも、</text>
  <text x="80" y="494" font-family="${FF}" font-weight="500" font-size="32" fill="${C.chalkSub}">AIに頼むだけでも。</text>

  <text x="80" y="572" font-family="${FF}" font-weight="500" font-size="30" fill="${C.chalk}">toban.app</text>

  <!-- 右：黒板に貼った紙の当番表 -->
  <g transform="rotate(2 910 380)">
    <rect x="690" y="160" width="440" height="400" rx="16" fill="${C.paper}" filter="url(#shadow)"/>
    <rect x="1030" y="146" width="96" height="30" fill="${C.highlight}" opacity="0.8" transform="rotate(8 1078 161)"/>
    <text x="714" y="228" font-family="${FF}" font-weight="500" font-size="30" fill="${C.text}">掃除当番</text>
    <rect x="1018" y="202" width="90" height="34" rx="17" fill="${C.board}" fill-opacity="0.1"/>
    <text x="1063" y="226" text-anchor="middle" font-family="${FF}" font-weight="500" font-size="20" fill="${C.board}">第2週</text>
    ${rowSvg}
  </g>

  <!-- AI への頼みごとの吹き出し -->
  <g transform="rotate(-3 820 120)" filter="url(#shadowSm)">
    <path d="M640 88 h370 a22 22 0 0 1 22 22 v44 a22 22 0 0 1 -22 22 h-354 a6 6 0 0 1 -6 -6 l-10 -60 a22 22 0 0 1 22 -22 z" fill="${C.highlight}"/>
    <text x="662" y="118" font-family="${FF}" font-weight="500" font-size="18" fill="${C.board}" fill-opacity="0.75">AIに頼むと</text>
    <text x="662" y="154" font-family="${FF}" font-weight="500" font-size="26" fill="${C.board}">「掃除当番を4人で毎週回して」</text>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: {
    fontFiles: [fontPath],
    loadSystemFonts: true,
    defaultFontFamily: "Kiwi Maru",
  },
  background: C.board,
});

const png = resvg.render().asPng();
await writeFile(outputPath, png);

const { width, height } = resvg.innerBBox() ?? { width: 1200, height: 630 };
console.log(
  `Generated ${path.relative(projectRoot, outputPath)} (${png.length} bytes, target 1200x630, content bbox ${width}x${height})`
);
