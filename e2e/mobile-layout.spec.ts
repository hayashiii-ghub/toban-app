import { test, expect } from "@playwright/test";

// スマホでは、表示の切り替え・当番表のタブ・操作の帯を画面の下にまとめて固定している。
// 表が画面より長いとき、最後までスクロールしても表の最後がその裏に残ると、そこが読めなくなる
// （ページの一番下の案内を「⋯」に移したときに、その余白ごと消えて起きた）
const colors = [
  ["#3B82F6", "#DBEAFE", "#1E3A5F"],
  ["#F97316", "#FED7AA", "#7C2D12"],
  ["#10B981", "#D1FAE5", "#064E3B"],
  ["#8B5CF6", "#EDE9FE", "#4C1D95"],
];
const longRoster = {
  schedules: [
    {
      id: "long",
      name: "長い当番表",
      rotation: 0,
      assignmentMode: "member",
      designThemeId: "sarasara/chalkboard",
      fontId: "standard",
      groups: Array.from({ length: 10 }, (_, i) => ({
        id: `g${i}`,
        tasks: [`仕事${i + 1}`],
        emoji: "🧹",
      })),
      members: Array.from({ length: 10 }, (_, i) => ({
        id: `m${i}`,
        name: `${i + 1}班`,
        color: colors[i % 4][0],
        bgColor: colors[i % 4][1],
        textColor: colors[i % 4][2],
      })),
    },
  ],
  activeScheduleId: "long",
};

test("スマホで最後までスクロールすると、表の最後が下に固定した部分の上に出る", async ({
  page,
}) => {
  await page.route("**/api/schedules**", route =>
    route.fulfill({ status: 400, body: "{}" })
  );
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript(state => {
    localStorage.setItem("rotation-schedule-app-state", JSON.stringify(state));
    localStorage.setItem("toban-onboarding-complete", "true");
  }, longRoster);
  await page.goto("/");

  const lastCard = page
    .getByRole("list", { name: "当番割り当て一覧" })
    .getByRole("listitem")
    .last();
  await expect(lastCard).toBeVisible();
  const panel = page.locator(".home-bottom-panel");
  await expect(panel).toHaveCSS("position", "fixed");

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await expect
    .poll(async () => {
      const card = await lastCard.boundingBox();
      const bar = await panel.boundingBox();
      return card && bar ? bar.y - (card.y + card.height) : -1;
    })
    .toBeGreaterThanOrEqual(0);
});
