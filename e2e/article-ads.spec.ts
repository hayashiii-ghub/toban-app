import { test, expect, type Page } from "@playwright/test";
import { TEMPLATE_CONTENT } from "../shared/template-content";
import { TEMPLATES } from "../shared/templates";

const article = "/templates/office-cleaning";
const content = TEMPLATE_CONTENT["office-cleaning"];
const adScript = "**/pagead/js/adsbygoogle.js*";
const adSelector = 'script[src*="pagead/js/adsbygoogle.js"]';

async function stubAds(page: Page) {
  await page.route(adScript, route =>
    route.fulfill({
      contentType: "application/javascript",
      // Simulate ongoing Auto Ads work, not just a removable script node.
      body: `document.documentElement.dataset.adsExecuted = "yes";
        setInterval(() => document.documentElement.dataset.adsTick = "yes", 10);`,
    })
  );
}

async function expectNoAds(page: Page) {
  await expect(page.locator(adSelector)).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-ads-executed");
  await expect(page.locator("html")).not.toHaveAttribute("data-ads-tick");
}

test.beforeEach(async ({ page }) => {
  await stubAds(page);
  await page.route("**/api/**", route =>
    route.fulfill({ status: 404, json: { error: "Not found" } })
  );
});

for (const locale of ["ja-JP", "en-US"]) {
  test.describe(locale, () => {
    test.use({ locale });

    test("loads ads only after the article and Japanese FAQ are rendered", async ({
      page,
    }) => {
      let hasBodyAtRequest = false;
      await page.route(adScript, async route => {
        hasBodyAtRequest = await page
          .getByText(content.body[0].paragraphs[0], { exact: true })
          .isVisible();
        await route.fallback();
      });
      await page.goto(article);
      await expect(page.locator("html")).toHaveAttribute(
        "data-ads-executed",
        "yes"
      );
      expect(hasBodyAtRequest).toBe(true);
      await expect(
        page.getByText(content.faq[0].answer, { exact: true })
      ).toBeVisible();
      await expect(
        page
          .getByText(content.body[0].paragraphs[0], { exact: true })
          .locator("..")
      ).toBeVisible();
      await expect(page.locator('section[lang="ja"]')).toHaveCount(2);
      if (locale === "en-US") {
        await expect(
          page.getByText(
            "This guide and its FAQ are currently available in Japanese."
          )
        ).toBeVisible();
      }
      await expect(page.locator(adSelector)).toHaveCount(1);
    });

    for (const path of [
      "/",
      "/about",
      "/templates",
      "/transfer",
      "/s/missing",
      "/templates/missing",
      "/404",
      "/unknown",
    ]) {
      test(`direct ${path} stays ad-free`, async ({ page }) => {
        const requests: string[] = [];
        page.on("request", request => {
          if (request.url().includes("adsbygoogle.js"))
            requests.push(request.url());
        });
        await page.goto(path);
        await expect(page.locator("#root")).not.toBeEmpty();
        await expect(page.getByRole("heading").first()).toBeVisible();
        await expectNoAds(page);
        expect(requests).toEqual([]);
      });
    }
  });
}

test("delayed article module does not load ads on the loading screen", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route("**/pages/TemplateDetailPage.tsx*", async route => {
    await gate;
    await route.continue();
  });
  await page.goto(article, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toBeVisible();
  await expectNoAds(page);
  release();
  await expect(page.locator("html")).toHaveAttribute(
    "data-ads-executed",
    "yes"
  );
});

test("shared loading and successful schedule stay ad-free", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route("**/api/schedules/shared-ok", async route => {
    await gate;
    await route.fulfill({
      json: {
        ...TEMPLATES[0],
        id: "shared-ok",
        slug: "shared-ok",
        name: "Shared schedule",
        rotation: 0,
        createdAt: "2026-10-07T00:00:00Z",
        updatedAt: "2026-10-07T00:00:00Z",
        isPublic: true,
      },
    });
  });
  await page.goto("/s/shared-ok", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toBeVisible();
  await expectNoAds(page);
  release();
  await expect(
    page.getByRole("heading", { name: "Shared schedule" })
  ).toBeVisible();
  await expectNoAds(page);
});

for (const method of ["pushState", "replaceState"] as const) {
  test(`executed Auto Ads are discarded before ${method} reaches the app`, async ({
    page,
  }) => {
    await page.goto(article);
    await expect(page.locator("html")).toHaveAttribute("data-ads-tick", "yes");
    const navigation = page.waitForEvent(
      "request",
      request =>
        request.isNavigationRequest() && new URL(request.url()).pathname === "/"
    );
    await page.evaluate(method => history[method]({}, "", "/"), method);
    await navigation;
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expectNoAds(page);
  });
}

test("a wouter Link leaves the ad document and back/forward retain isolation", async ({
  page,
}) => {
  await page.goto(article);
  await expect(page.locator("html")).toHaveAttribute("data-ads-tick", "yes");
  await page.getByRole("link", { name: "テンプレート一覧に戻る" }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expectNoAds(page);
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute(
    "data-ads-executed",
    "yes"
  );
  await page.goForward();
  await expect(page).toHaveURL(/\/templates$/);
  await expectNoAds(page);
});

test("back to an earlier SPA entry reloads before rendering an excluded route", async ({
  page,
}) => {
  await page.goto("/templates");
  await page.locator(`a[href="${article}"]`).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-ads-tick", "yes");
  const navigation = page.waitForEvent(
    "request",
    request =>
      request.isNavigationRequest() &&
      new URL(request.url()).pathname === "/templates"
  );
  await page.goBack();
  await navigation;
  await expect(page).toHaveURL(/\/templates$/);
  await expectNoAds(page);
});

test("a pending ad request cannot execute in the destination error page", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route(adScript, async route => {
    await gate;
    await route.fallback();
  });
  await page.goto(article, { waitUntil: "domcontentloaded" });
  await expect(page.locator(adSelector)).toHaveCount(1);
  await page.evaluate(() => history.pushState({}, "", "/404"));
  await expect(page).toHaveURL(/\/404$/);
  release();
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expectNoAds(page);
});

test("error recovery resets executed ads and does not restart them on reload", async ({
  page,
}) => {
  await page.goto(article);
  await expect(page.locator("html")).toHaveAttribute("data-ads-tick", "yes");
  const navigation = page.waitForEvent("request", request =>
    request.isNavigationRequest()
  );
  // Exercise the same recovery called by ErrorBoundary after a render failure.
  await page.evaluate(async () => {
    const modulePath = "/src/lib/articleAds.ts";
    const { resetAdsAfterError } = await import(modulePath);
    resetAdsAfterError();
  });
  await navigation;
  await expect(
    page.getByText(content.body[0].paragraphs[0], { exact: true })
  ).toBeVisible();
  await expectNoAds(page);
  await page.reload();
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expectNoAds(page);
});
