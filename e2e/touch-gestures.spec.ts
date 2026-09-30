import { test, expect, type Page } from "@playwright/test";

// スマホの指の操作。HTML の drag and drop は指では動かないので、並べ替えは pointer イベントで作っている。
// Playwright の touchscreen は tap しかないので、Chromium の CDP で指の動き（touchStart → touchMove → touchEnd）を送る
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

const colors = { color: "#3B82F6", bgColor: "#DBEAFE", textColor: "#1E3A5F" };
const state = {
  schedules: [
    {
      id: "s1",
      name: "掃除当番",
      rotation: 0,
      assignmentMode: "member",
      designThemeId: "sarasara/chalkboard",
      fontId: "standard",
      groups: [
        { id: "g1", tasks: ["床", "窓"], emoji: "🧹" },
        { id: "g2", tasks: ["ゴミ出し"], emoji: "🗑️" },
      ],
      members: [
        { id: "m1", name: "佐藤", ...colors },
        { id: "m2", name: "鈴木", ...colors },
      ],
    },
    {
      id: "s2",
      name: "給食当番",
      rotation: 0,
      designThemeId: "sarasara/chalkboard",
      fontId: "standard",
      groups: [{ id: "g1", tasks: ["配膳"], emoji: "🍚" }],
      members: [{ id: "m1", name: "佐藤", ...colors }],
    },
  ],
  activeScheduleId: "s1",
};

async function open(page: Page) {
  await page.route("**/api/schedules**", route =>
    route.fulfill({ status: 400, body: "{}" })
  );
  await page.addInitScript(s => {
    localStorage.setItem("rotation-schedule-app-state", JSON.stringify(s));
    localStorage.setItem("toban-onboarding-complete", "true");
  }, state);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "当番表を編集する" })
  ).toBeVisible();
}

/** 指を置いて、少しずつ動かして、離す。holdMs だけ置いたまま待ってから動かす（長押し） */
async function swipe(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  holdMs = 0
) {
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });
  await touch("touchStart", from.x, from.y);
  if (holdMs) await page.waitForTimeout(holdMs);
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await touch(
      "touchMove",
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps
    );
  }
  await touch("touchEnd");
  await cdp.detach();
}

const center = async (page: Page, selector: string) => {
  const target = page.locator(selector).first();
  // 下から出てくる途中の座標では、指を離す位置が行間にずれる。安定してから読む。
  await target.click({ trial: true });
  const box = (await target.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test("編集画面で、仕事の行をつまむ印から指で動かして並べ替えられる", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "当番表を編集する" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("グループ1のタスク2")).toHaveValue("窓");

  const grip = await center(page, '[data-drop-task="0:1"] [data-drag-grip]');
  const target = await center(page, '[data-drop-task="0:0"]');
  await swipe(page, grip, { x: grip.x, y: target.y });

  await expect(dialog.getByLabel("グループ1のタスク1")).toHaveValue("窓");
  await expect(dialog.getByLabel("グループ1のタスク2")).toHaveValue("床");
});

test("下から出る編集画面は、見出しを下になでると閉じる", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "当番表を編集する" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const title = await center(page, "#settings-title");
  await swipe(page, title, { x: title.x, y: title.y + 220 });
  await expect(dialog).toBeHidden();
});

test("当番表のタブは、長押しのあと指で動かして並べ替えられる", async ({
  page,
}) => {
  await open(page);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveText([/掃除当番/, /給食当番/]);

  const from = await center(page, '[data-drop-tab="s2"]');
  const to = await center(page, '[data-drop-tab="s1"]');
  await swipe(page, from, to, 700);

  await expect(tabs).toHaveText([/給食当番/, /掃除当番/]);
  await expect(page.getByRole("menu")).toBeHidden();
});

test("当番表のタブを長押しせずに動かしたときは、並べ替えない（横のスクロール）", async ({
  page,
}) => {
  await open(page);
  const from = await center(page, '[data-drop-tab="s2"]');
  const to = await center(page, '[data-drop-tab="s1"]');
  await swipe(page, from, to);
  await expect(page.getByRole("tab")).toHaveText([/掃除当番/, /給食当番/]);
});
