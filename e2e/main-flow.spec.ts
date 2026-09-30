import { test, expect } from "@playwright/test";

test.describe("メインフロー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("toban-onboarding-complete", "true");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    // Background backup/retries and remote assets need not become idle before
    // the local editor is ready. Wait for the actual interaction instead.
    await expect(
      page.getByRole("button", { name: "当番表を編集する" })
    ).toBeVisible();
  });

  test("初期表示: デフォルトスケジュールが表示される", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("設定モーダル: スケジュール名を編集して保存", async ({ page }) => {
    await page.getByRole("button", { name: "当番表を編集する" }).click();

    const modal = page.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    // 当番表の名前は、最初に開いている「名前と仕事」の先頭にある
    const nameInput = modal.getByLabel("当番表の名前");
    await nameInput.clear();
    await nameInput.fill("テスト当番表");

    await modal.getByRole("button", { name: "保存する" }).click();
    await expect(modal).not.toBeVisible();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "テスト当番表"
    );
  });

  test("表示切り替え: カード → 早見表 → カレンダー → カード", async ({
    page,
  }) => {
    const cards = page.getByRole("list", { name: "当番割り当て一覧" });
    const table = page.getByRole("table", { name: "ローテーション早見表" });
    const calendar = page.getByRole("heading", { name: "カレンダー" });
    await expect(cards).toBeVisible();

    await page.getByRole("button", { name: "早見表" }).click();
    await expect(table).toBeVisible();
    await expect(cards).toBeHidden();

    await page.getByRole("button", { name: "カレンダー" }).click();
    await expect(calendar).toBeVisible();
    await expect(table).toBeHidden();

    await page.getByRole("button", { name: "カード" }).click();
    await expect(cards).toBeVisible();
    await expect(calendar).toBeHidden();
  });

  test("ローテーション: 次へで順番が進む", async ({ page }) => {
    await expect(
      page.getByLabel("現在の順番: 0", { exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "次の当番に進める" }).click();
    await expect(
      page.getByLabel("現在の順番: 1", { exact: true })
    ).toBeVisible();
  });

  test("新しい当番表を追加するとタブが増える", async ({ page }) => {
    const tabs = page.getByRole("tab");
    const before = await tabs.count();

    await page.getByRole("button", { name: "新しい当番表を追加" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /新しくつくる/ }).click();

    await expect(dialog).toBeHidden();
    await expect(tabs).toHaveCount(before + 1);
  });

  // QRCode の import が壊れると、共有モーダルごと React error #130 で落ちる。
  // ユニットテストに加えて、実ブラウザでも本物のモジュールで描画を確かめる。
  test("共有モーダルが開く（API をスタブ）", async ({ page }) => {
    await page.route("**/api/schedules**", route => {
      const isPublish = new URL(route.request().url()).pathname.endsWith(
        "/publish"
      );
      const body =
        route.request().method() === "POST" && !isPublish
          ? '{"slug":"AbCdEfGhIj","editToken":"tok"}'
          : '{"ok":true}';
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body,
      });
    });

    await page.getByRole("button", { name: "共有" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText("/s/AbCdEfGhIj")).toBeVisible();
    // QRCode が描画されていること（壊れていると SVG ごと出ない）
    await expect(modal.locator("svg[viewBox]").first()).toBeVisible();
    // エラーバウンダリに落ちていないこと
    await expect(page.getByText("予期しないエラーが発生しました")).toBeHidden();
  });

  test("ランディングページが表示される", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("テンプレートページが表示される", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("存在しないページは404", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("印刷では AdSense の広告を出さない", async ({ page }) => {
    // AdSense は ins.adsbygoogle に display:block を直接書くので、!important で消す
    await page.evaluate(() => {
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.cssText = "display:block;width:300px;height:250px";
      document.body.appendChild(ins);
    });
    const ad = page.locator("ins.adsbygoogle").last();
    await expect(ad).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(ad).toBeHidden();
  });

  test("プライバシーポリシーへの導線と中身", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "プライバシー" })
    ).toHaveAttribute("href", "/privacy");
    // 本番は /privacy で配信する。開発サーバーは拡張子付きで読む
    await page.goto("/privacy.html");
    await expect(
      page.getByRole("heading", { name: "プライバシーポリシー", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Google AdSense").first()).toBeVisible();
  });

  test("localStorage にデータが保存される", async ({ page }) => {
    const hasData = await page.evaluate(() => {
      for (const [, value] of Object.entries(localStorage)) {
        if (value.includes("schedules") || value.includes("activeScheduleId"))
          return true;
      }
      return false;
    });
    expect(hasData).toBe(true);
  });
});
