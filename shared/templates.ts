import { MEMBER_PRESETS } from "./appearance";
import type { Member, ScheduleTemplate } from "./types";

const [RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE, PINK] = MEMBER_PRESETS;

const member = (
  id: string,
  name: string,
  color: (typeof MEMBER_PRESETS)[number]
): Member => ({ id, name, ...color });

// 見た目は場面に合わせて質感と色を選ぶ。
// さらさら（細い線）: 事務・安全確認・スタッフ向けなど、きちんと読ませたいもの
// ざらざら（太い線）: 教室・屋外・部活・お店など、貼って遠くからも目立たせたいもの
// もちもち（枠なし）: 保育・家庭・読み聞かせなど、やわらかく親しみやすくしたいもの
export const TEMPLATES: ScheduleTemplate[] = [
  // ── 事務室・オフィス向け ──
  {
    name: "事務室の掃除当番",
    emoji: "🏢",
    designThemeId: "sarasara/whiteboard",
    groups: [
      { id: "g1", tasks: ["掃除機・モップ"], emoji: "🧹" },
      { id: "g2", tasks: ["トイレ・洗面台"], emoji: "🚿" },
      { id: "g3", tasks: ["ゴミ回収・ゴミ出し"], emoji: "🗑️" },
      { id: "g4", tasks: ["給湯室・流し台"], emoji: "🍵" },
    ],
    members: [
      member("m1", "佐藤", BLUE),
      member("m2", "鈴木", ORANGE),
      member("m3", "高橋", GREEN),
      member("m4", "田中", PURPLE),
    ],
  },
  {
    name: "電話・来客当番",
    emoji: "📞",
    designThemeId: "sarasara/ocean",
    groups: [
      { id: "g1", tasks: ["午前の電話・来客対応"], emoji: "📞" },
      { id: "g2", tasks: ["午後の電話・来客対応"], emoji: "🤝" },
      { id: "g3", tasks: ["郵便物の仕分け・配布"], emoji: "📦" },
    ],
    members: [
      member("m1", "佐藤", GREEN),
      member("m2", "鈴木", YELLOW),
      member("m3", "高橋", RED),
    ],
  },
  // ── 幼稚園・保育園向け ──
  {
    name: "園内おそうじ当番",
    emoji: "🌷",
    designThemeId: "mochimochi/crayon",
    groups: [
      { id: "g1", tasks: ["保育室の掃除・消毒"], emoji: "🧹" },
      { id: "g2", tasks: ["トイレ掃除・補充"], emoji: "🚿" },
      { id: "g3", tasks: ["園庭・遊具の点検・片付け"], emoji: "🏞️" },
      { id: "g4", tasks: ["玄関の掃き掃除", "廊下のモップがけ"], emoji: "🚪" },
    ],
    members: [
      member("m1", "さくら組", PINK),
      member("m2", "ひまわり組", ORANGE),
      member("m3", "たんぽぽ組", YELLOW),
      member("m4", "すみれ組", PURPLE),
    ],
  },
  {
    name: "バス添乗・お迎え当番",
    emoji: "🚌",
    designThemeId: "mochimochi/sunflower",
    groups: [
      { id: "g1", tasks: ["朝バス添乗", "乗車人数確認"], emoji: "🌅" },
      { id: "g2", tasks: ["帰りバス添乗", "降車確認"], emoji: "🌇" },
      { id: "g3", tasks: ["お迎え対応・門番"], emoji: "🚪" },
    ],
    members: [
      member("m1", "山田先生", BLUE),
      member("m2", "中村先生", GREEN),
      member("m3", "小林先生", ORANGE),
    ],
  },
  {
    name: "預かり保育当番",
    emoji: "🕐",
    designThemeId: "mochimochi/sakura",
    groups: [
      { id: "g1", tasks: ["早朝保育（7:30〜）"], emoji: "🌅" },
      { id: "g2", tasks: ["延長保育（〜18:00）"], emoji: "🌇" },
      { id: "g3", tasks: ["おやつ準備・片付け"], emoji: "🍪" },
    ],
    members: [
      member("m1", "吉田先生", YELLOW),
      member("m2", "伊藤先生", PINK),
      member("m3", "渡辺先生", RED),
    ],
  },
  {
    name: "午睡チェック当番",
    emoji: "😴",
    designThemeId: "sarasara/nightsky",
    assignmentMode: "task",
    groups: [
      {
        id: "g1",
        tasks: ["ブレスチェック（0歳児）", "体位確認"],
        emoji: "🍼",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g2",
        tasks: ["ブレスチェック（1歳児）", "体位確認"],
        emoji: "🧸",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g3",
        tasks: ["ブレスチェック（2歳児）", "体位確認"],
        emoji: "🐣",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g4",
        tasks: ["室温・湿度記録"],
        emoji: "🌡️",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
    ],
    members: [
      member("m1", "佐藤先生", RED),
      member("m2", "田中先生", BLUE),
      member("m3", "山田先生", GREEN),
      member("m4", "鈴木先生", PURPLE),
    ],
  },
  {
    name: "アレルギー対応確認",
    emoji: "⚠️",
    designThemeId: "sarasara/crayon",
    assignmentMode: "task",
    groups: [
      // 1 つの担当は 1 人が受け持つ。確認とダブルチェックを別の担当にして、必ず違う人が入るようにする
      {
        id: "g1",
        tasks: ["除去食チェック（給食）"],
        emoji: "🍳",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g2",
        tasks: ["配膳ダブルチェック（給食）"],
        emoji: "✅",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g3",
        tasks: ["喫食時見守り（給食）"],
        emoji: "👀",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g4",
        tasks: ["おやつの内容確認"],
        emoji: "🍪",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g5",
        tasks: ["配膳チェック（おやつ）"],
        emoji: "☑️",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g6",
        tasks: ["喫食時見守り（おやつ）"],
        emoji: "👀",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
    ],
    members: [
      member("m1", "佐藤先生", RED),
      member("m2", "田中先生", ORANGE),
      member("m3", "山田先生", GREEN),
      member("m4", "鈴木先生", BLUE),
    ],
  },
  // ── 小中学校向け（クラス用） ──
  {
    name: "教室そうじ当番",
    emoji: "🏫",
    designThemeId: "zarazara/chalkboard",
    groups: [
      { id: "g1", tasks: ["教室（ほうき・ちりとり）"], emoji: "🧹" },
      { id: "g2", tasks: ["教室（ぞうきんがけ）"], emoji: "💧" },
      { id: "g3", tasks: ["ろうか・階段"], emoji: "🚶" },
      { id: "g4", tasks: ["トイレそうじ"], emoji: "🚿" },
      { id: "g5", tasks: ["黒板・黒板消しクリーナー"], emoji: "📝" },
    ],
    members: [
      member("m1", "1班", BLUE),
      member("m2", "2班", ORANGE),
      member("m3", "3班", GREEN),
      member("m4", "4班", PURPLE),
      member("m5", "5班", PINK),
    ],
  },
  {
    name: "給食当番",
    emoji: "🍽️",
    designThemeId: "zarazara/crayon",
    groups: [
      { id: "g1", tasks: ["配膳（おかず）"], emoji: "🍚" },
      { id: "g2", tasks: ["配膳（汁物）", "配膳（ごはん）"], emoji: "🥢" },
      { id: "g3", tasks: ["牛乳・ストロー配り"], emoji: "🥛" },
      { id: "g4", tasks: ["片付け", "台拭き"], emoji: "🧽" },
    ],
    members: [
      member("m1", "1班", BLUE),
      member("m2", "2班", ORANGE),
      member("m3", "3班", GREEN),
      member("m4", "4班", YELLOW),
    ],
  },
  {
    name: "日直",
    emoji: "📋",
    designThemeId: "sarasara/chalkboard",
    groups: [
      { id: "g1", tasks: ["朝の会の司会", "帰りの会の司会"], emoji: "🎤" },
      { id: "g2", tasks: ["黒板消し", "日誌記入"], emoji: "📝" },
      { id: "g3", tasks: ["号令", "あいさつ"], emoji: "🙋" },
    ],
    members: [
      member("m1", "Aペア", PURPLE),
      member("m2", "Bペア", PINK),
      member("m3", "Cペア", YELLOW),
    ],
  },
  {
    name: "配布物・プリント係",
    emoji: "📄",
    designThemeId: "zarazara/lavender",
    groups: [
      { id: "g1", tasks: ["プリント配り"], emoji: "📄" },
      { id: "g2", tasks: ["提出物の回収・チェック"], emoji: "✅" },
      { id: "g3", tasks: ["連絡帳配り"], emoji: "📒" },
      { id: "g4", tasks: ["欠席者分のプリント保管"], emoji: "📂" },
    ],
    members: [
      member("m1", "1班", BLUE),
      member("m2", "2班", ORANGE),
      member("m3", "3班", GREEN),
      member("m4", "4班", PURPLE),
    ],
  },
  {
    name: "水やり・生き物係",
    emoji: "🌱",
    designThemeId: "mochimochi/nature",
    assignmentMode: "task",
    groups: [
      {
        id: "g1",
        tasks: ["花壇・プランターの水やり"],
        emoji: "🌻",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g2",
        tasks: ["メダカ・生き物のえさやり"],
        emoji: "🐟",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g3",
        tasks: ["水槽・飼育ケースの掃除"],
        emoji: "🫧",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
      {
        id: "g4",
        tasks: ["観察日記の記録"],
        emoji: "📓",
        memberIds: ["m1", "m2", "m3", "m4"],
      },
    ],
    members: [
      member("m1", "1班", GREEN),
      member("m2", "2班", YELLOW),
      member("m3", "3班", BLUE),
      member("m4", "4班", ORANGE),
    ],
  },
  {
    name: "換気・教室環境当番",
    emoji: "🪟",
    designThemeId: "zarazara/ocean",
    groups: [
      { id: "g1", tasks: ["朝の窓開け・換気"], emoji: "🪟" },
      { id: "g2", tasks: ["休み時間の換気確認"], emoji: "🌬️" },
      { id: "g3", tasks: ["帰りの戸締り・窓閉め"], emoji: "🔒" },
      { id: "g4", tasks: ["加湿器の水入れ・管理"], emoji: "💧" },
    ],
    members: [
      member("m1", "1班", BLUE),
      member("m2", "2班", GREEN),
      member("m3", "3班", YELLOW),
      member("m4", "4班", RED),
    ],
  },
  // ── 職員室向け（先生用） ──
  {
    name: "校内巡回・施錠当番",
    emoji: "🔑",
    designThemeId: "sarasara/nightsky",
    groups: [
      { id: "g1", tasks: ["朝の校門立ち当番"], emoji: "🚸" },
      { id: "g2", tasks: ["昼休み巡回"], emoji: "👀" },
      { id: "g3", tasks: ["放課後の施錠・戸締り"], emoji: "🔒" },
    ],
    members: [
      member("m1", "山田先生", BLUE),
      member("m2", "中村先生", ORANGE),
      member("m3", "小林先生", GREEN),
    ],
  },
  // ── PTA・保護者会向け ──
  {
    name: "旗振り（登下校見守り）当番",
    emoji: "🚩",
    designThemeId: "zarazara/sunflower",
    groups: [
      { id: "g1", tasks: ["東門の旗振り", "横断サポート"], emoji: "🏫" },
      { id: "g2", tasks: ["西門の旗振り", "横断サポート"], emoji: "🚸" },
      { id: "g3", tasks: ["交差点の旗振り", "車両の停止確認"], emoji: "🚦" },
    ],
    members: [
      member("m1", "山田", BLUE),
      member("m2", "佐藤", ORANGE),
      member("m3", "中村", GREEN),
    ],
  },
  {
    name: "PTA行事準備当番",
    emoji: "🎪",
    designThemeId: "sarasara/sakura",
    groups: [
      { id: "g1", tasks: ["机・椅子の搬入", "看板・装飾設置"], emoji: "🪑" },
      { id: "g2", tasks: ["受付・名簿チェック", "来場者案内"], emoji: "📋" },
      {
        id: "g3",
        tasks: ["ゴミ回収・分別", "机・椅子の撤収", "忘れ物確認"],
        emoji: "🧹",
      },
    ],
    members: [
      member("m1", "山田", BLUE),
      member("m2", "鈴木", ORANGE),
      member("m3", "高橋", GREEN),
    ],
  },
  {
    name: "プール監視当番",
    emoji: "🏊",
    designThemeId: "mochimochi/ocean",
    groups: [
      {
        id: "g1",
        tasks: ["プールサイド監視（午前）", "入水人数チェック"],
        emoji: "🌅",
      },
      {
        id: "g2",
        tasks: ["プールサイド監視（午後）", "入水人数チェック"],
        emoji: "🌇",
      },
      { id: "g3", tasks: ["救護・AED準備", "水温・気温記録"], emoji: "🩹" },
    ],
    members: [
      member("m1", "田中", PURPLE),
      member("m2", "伊藤", PINK),
      member("m3", "渡辺", RED),
    ],
  },
  {
    name: "読み聞かせボランティア",
    emoji: "📖",
    designThemeId: "mochimochi/lavender",
    groups: [
      { id: "g1", tasks: ["1年生の教室"], emoji: "🌸" },
      { id: "g2", tasks: ["2年生の教室"], emoji: "🌸" },
      { id: "g3", tasks: ["3年生の教室"], emoji: "🌿" },
      { id: "g4", tasks: ["4年生の教室"], emoji: "🌿" },
      { id: "g5", tasks: ["5年生の教室"], emoji: "🌳" },
      { id: "g6", tasks: ["6年生の教室"], emoji: "🌳" },
    ],
    members: [
      member("m1", "山田", BLUE),
      member("m2", "佐藤", ORANGE),
      member("m3", "鈴木", GREEN),
      member("m4", "高橋", PURPLE),
      member("m5", "伊藤", PINK),
      member("m6", "中村", YELLOW),
    ],
  },
  // ── 介護施設向け ──
  {
    name: "フロア担当",
    emoji: "🏥",
    designThemeId: "sarasara/nature",
    assignmentMode: "task",
    groups: [
      // リーダーとサブは別の人が入るよう、別の担当にする
      {
        id: "g1",
        tasks: ["1階 日勤リーダー"],
        emoji: "1️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g2",
        tasks: ["1階 日勤サブ"],
        emoji: "1️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g3",
        tasks: ["2階 日勤リーダー"],
        emoji: "2️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g4",
        tasks: ["2階 日勤サブ"],
        emoji: "2️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g5",
        tasks: ["3階 日勤リーダー"],
        emoji: "3️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g6",
        tasks: ["3階 日勤サブ"],
        emoji: "3️⃣",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
    ],
    members: [
      member("m1", "高橋", RED),
      member("m2", "伊藤", BLUE),
      member("m3", "渡辺", GREEN),
      member("m4", "小林", ORANGE),
      member("m5", "加藤", PURPLE),
      member("m6", "吉田", PINK),
    ],
  },
  {
    name: "入浴介助当番",
    emoji: "🛁",
    designThemeId: "mochimochi/ocean",
    assignmentMode: "task",
    groups: [
      // 役割ごとに別の人が入るよう、午前・午後それぞれ 3 つの担当に分ける。
      // この並びなら、5 人のとき午前と午後の浴室内介助は別の人になる
      {
        id: "g1",
        tasks: ["浴室内介助（午前）"],
        emoji: "🛁",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g2",
        tasks: ["脱衣・着衣介助（午前）"],
        emoji: "👕",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g3",
        tasks: ["誘導・見守り（午前）"],
        emoji: "🚶",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g4",
        tasks: ["浴室内介助（午後）"],
        emoji: "🛁",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g5",
        tasks: ["脱衣・着衣介助（午後）"],
        emoji: "👕",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g6",
        tasks: ["誘導・見守り（午後）"],
        emoji: "🚶",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
    ],
    members: [
      member("m1", "高橋", RED),
      member("m2", "伊藤", BLUE),
      member("m3", "渡辺", GREEN),
      member("m4", "小林", ORANGE),
      member("m5", "加藤", YELLOW),
    ],
  },
  {
    name: "夜勤当番",
    emoji: "🌙",
    designThemeId: "sarasara/nightsky",
    assignmentMode: "task",
    groups: [
      {
        id: "g1",
        tasks: ["巡回（2時間おき）", "ナースコール対応", "記録・申し送り準備"],
        emoji: "🔦",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g2",
        tasks: ["起床介助", "朝食準備補助"],
        emoji: "🌅",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
    ],
    members: [
      member("m1", "高橋", BLUE),
      member("m2", "伊藤", GREEN),
      member("m3", "渡辺", ORANGE),
      member("m4", "小林", RED),
      member("m5", "加藤", PURPLE),
    ],
  },
  // ── 自治会・マンション向け ──
  {
    name: "町内会 清掃・管理当番",
    emoji: "🏘️",
    designThemeId: "zarazara/nature",
    groups: [
      { id: "g1", tasks: ["ゴミ集積所清掃", "不法投棄チェック"], emoji: "🗑️" },
      { id: "g2", tasks: ["公園清掃", "遊具点検"], emoji: "🌳" },
      { id: "g3", tasks: ["夜間パトロール", "街灯確認"], emoji: "🔦" },
    ],
    members: [
      member("m1", "1班（東町）", RED),
      member("m2", "2班（西町）", BLUE),
      member("m3", "3班（南町）", GREEN),
      member("m4", "4班（北町）", ORANGE),
      member("m5", "5班（中央）", PURPLE),
    ],
  },
  {
    name: "マンション共用部管理",
    emoji: "🏬",
    designThemeId: "sarasara/whiteboard",
    groups: [
      {
        id: "g1",
        tasks: ["エントランス清掃", "郵便受け周り整理"],
        emoji: "🚪",
      },
      { id: "g2", tasks: ["ゴミ置き場清掃", "分別チェック"], emoji: "🗑️" },
      { id: "g3", tasks: ["共用廊下見回り", "駐輪場整理"], emoji: "👀" },
      { id: "g4", tasks: ["植栽水やり", "敷地内除草"], emoji: "🌿" },
    ],
    members: [
      member("m1", "1階（101-105）", BLUE),
      member("m2", "2階（201-205）", GREEN),
      member("m3", "3階（301-305）", ORANGE),
      member("m4", "4階（401-405）", PURPLE),
      member("m5", "5階（501-505）", RED),
    ],
  },
  // ── 飲食店・店舗向け ──
  {
    name: "飲食店 開店・閉店作業",
    emoji: "🍴",
    designThemeId: "zarazara/chalkboard",
    assignmentMode: "task",
    groups: [
      {
        id: "g1",
        tasks: ["仕込み", "テーブルセット", "看板・メニュー出し", "レジ開け"],
        emoji: "☀️",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g2",
        tasks: ["フロア清掃", "厨房清掃", "戸締り確認", "レジ締め・売上報告"],
        emoji: "🌙",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
      {
        id: "g3",
        tasks: ["トイレ清掃（午前）", "トイレ清掃（午後）", "備品補充"],
        emoji: "🧹",
        memberIds: ["m1", "m2", "m3", "m4", "m5", "m6"],
      },
    ],
    members: [
      member("m1", "中村（店長）", RED),
      member("m2", "山本", BLUE),
      member("m3", "小林", GREEN),
      member("m4", "加藤", ORANGE),
      member("m5", "渡辺", PURPLE),
      member("m6", "木村", PINK),
    ],
  },
  // ── 家庭・暮らし向け ──
  {
    name: "家事ローテーション",
    emoji: "🏠",
    designThemeId: "mochimochi/sunflower",
    assignmentMode: "task",
    groups: [
      {
        id: "g1",
        tasks: ["お風呂掃除"],
        emoji: "🛁",
        memberIds: ["m1", "m2", "m3"],
      },
      {
        id: "g2",
        tasks: ["ゴミ出し"],
        emoji: "🗑️",
        memberIds: ["m1", "m2", "m3"],
      },
      {
        id: "g3",
        tasks: ["洗剤・ゴミ袋の補充"],
        emoji: "🧴",
        memberIds: ["m1", "m2", "m3"],
      },
    ],
    members: [
      member("m1", "パパ", BLUE),
      member("m2", "ママ", PINK),
      member("m3", "太郎", GREEN),
    ],
  },
  {
    name: "シェアハウス 共用部管理",
    emoji: "🏡",
    designThemeId: "mochimochi/nature",
    groups: [
      { id: "g1", tasks: ["キッチン清掃", "シンク・排水口掃除"], emoji: "🍳" },
      {
        id: "g2",
        tasks: ["浴室清掃", "洗面台清掃", "排水口の髪取り"],
        emoji: "🛁",
      },
      { id: "g3", tasks: ["可燃ゴミ出し", "資源ゴミ分別・搬出"], emoji: "🗑️" },
      {
        id: "g4",
        tasks: ["リビング掃除機がけ", "玄関清掃", "共用トイレ清掃"],
        emoji: "🛋️",
      },
    ],
    members: [
      member("m1", "ゆうき", BLUE),
      member("m2", "あかり", PINK),
      member("m3", "けんた", GREEN),
      member("m4", "みさき", ORANGE),
      member("m5", "そうた", PURPLE),
    ],
  },
  // ── その他の団体向け ──
  {
    name: "スポーツチーム・部活動",
    emoji: "⚽",
    designThemeId: "zarazara/ocean",
    assignmentMode: "task",
    groups: [
      // 練習後の片付けを練習前とは別の担当にして、最後まで残る人を最初から決めておく
      {
        id: "g1",
        tasks: ["グラウンド整備（練習前）", "ライン引き"],
        emoji: "⚽",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g2",
        tasks: ["用具準備・搬出"],
        emoji: "🏟️",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g3",
        tasks: ["ドリンク準備", "氷・水補充", "ジャグ洗浄"],
        emoji: "🥤",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g4",
        tasks: ["グラウンド整備（練習後）", "用具片付け・点検"],
        emoji: "🧹",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
      {
        id: "g5",
        tasks: ["部室清掃", "出欠記録"],
        emoji: "📋",
        memberIds: ["m1", "m2", "m3", "m4", "m5"],
      },
    ],
    members: [
      member("m1", "1年A班", GREEN),
      member("m2", "1年B班", BLUE),
      member("m3", "2年A班", ORANGE),
      member("m4", "2年B班", RED),
      member("m5", "3年班", PURPLE),
    ],
  },
  {
    name: "教会・寺院 奉仕当番",
    emoji: "🙏",
    designThemeId: "sarasara/lavender",
    groups: [
      {
        id: "g1",
        tasks: ["本堂・礼拝堂清掃", "境内清掃・落ち葉掃き"],
        emoji: "🧹",
      },
      { id: "g2", tasks: ["受付・参拝者案内", "お茶出し"], emoji: "🙏" },
      { id: "g3", tasks: ["献花・供花手入れ", "花瓶の水替え"], emoji: "💐" },
      {
        id: "g4",
        tasks: ["法要・行事準備", "椅子・座布団配置", "片付け"],
        emoji: "📿",
      },
    ],
    members: [
      member("m1", "松組", GREEN),
      member("m2", "竹組", BLUE),
      member("m3", "梅組", RED),
      member("m4", "桜組", PINK),
    ],
  },
  // ── チェックリスト・TODO ──
  {
    name: "イベント準備チェックリスト",
    emoji: "📝",
    assignmentMode: "task",
    designThemeId: "sarasara/crayon",
    groups: [
      { id: "g1", tasks: ["会場の予約・下見"], emoji: "🏢" },
      {
        id: "g2",
        tasks: ["備品・機材の準備", "マイク・プロジェクター・延長コード"],
        emoji: "📦",
      },
      {
        id: "g3",
        tasks: ["告知・案内状の作成", "参加者リストの管理"],
        emoji: "📣",
      },
      { id: "g4", tasks: ["当日の受付・誘導", "タイムキーパー"], emoji: "🎤" },
      { id: "g5", tasks: ["撤収・片付け", "忘れ物チェック"], emoji: "🧹" },
    ],
    members: [
      member("m1", "総務チーム", BLUE),
      member("m2", "広報チーム", ORANGE),
      member("m3", "会計チーム", GREEN),
      member("m4", "運営チーム", PURPLE),
      member("m5", "設営チーム", RED),
    ],
  },
  {
    name: "新学期やることリスト",
    emoji: "🌸",
    assignmentMode: "task",
    designThemeId: "mochimochi/sakura",
    groups: [
      { id: "g1", tasks: ["名簿・座席表の作成"], emoji: "📋" },
      { id: "g2", tasks: ["教室の掲示・レイアウト準備"], emoji: "🏫" },
      { id: "g3", tasks: ["配布物の印刷・仕分け"], emoji: "🖨️" },
      { id: "g4", tasks: ["保護者向け連絡・学級通信"], emoji: "✉️" },
      { id: "g5", tasks: ["当番表・係決め準備"], emoji: "📝" },
    ],
    members: [
      member("m1", "担任", PINK),
      member("m2", "副担任", BLUE),
      member("m3", "学年主任", GREEN),
      member("m4", "教務", ORANGE),
      member("m5", "事務", PURPLE),
    ],
  },
  {
    name: "引っ越しやることリスト",
    emoji: "📦",
    assignmentMode: "task",
    designThemeId: "sarasara/sunflower",
    groups: [
      {
        id: "g1",
        tasks: ["転出届・転入届", "電気・ガス・水道の手続き"],
        emoji: "📄",
      },
      { id: "g2", tasks: ["荷造り・不用品処分"], emoji: "🗃️" },
      { id: "g3", tasks: ["新居の掃除・家具配置"], emoji: "🏠" },
      { id: "g4", tasks: ["旧居の掃除・退去立ち会い"], emoji: "🧹" },
    ],
    members: [
      member("m1", "自分", BLUE),
      member("m2", "パートナー", PINK),
      member("m3", "家族", GREEN),
      member("m4", "業者", ORANGE),
    ],
  },
  // ── カスタム ──
  {
    name: "カスタム（空白）",
    emoji: "✨",
    groups: [{ id: "g1", tasks: ["タスク1"], emoji: "📌" }],
    members: [member("m1", "メンバー1", BLUE)],
  },
];
