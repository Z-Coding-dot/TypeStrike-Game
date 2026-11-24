import { expect, test, type Page } from "@playwright/test";

async function chooseLanguage(page: Page, code: "en" | "fa"): Promise<void> {
  await page.locator(`[data-testid="language-${code}"]:visible`).first().click();
}

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        // Storage may be unavailable; defaults are still used.
      }
    });
    await page.goto("/");
  });

  test("loads with a heading, header and call to action", async ({ page }) => {
    await expect(page).toHaveTitle(/TypeStrike/);
    await expect(page.getByTestId("site-header")).toBeVisible();
    await expect(page.getByTestId("site-footer")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("hero-title")).toBeVisible();
    await expect(page.getByTestId("play-now")).toBeVisible();
    await expect(page.getByTestId("play-now")).toHaveAttribute("href", "/game");
  });

  test("language selector switches document direction to RTL and back", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await chooseLanguage(page, "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa-AF");
    await expect(page.locator('[data-testid="language-fa"]:visible').first()).toHaveAttribute("aria-pressed", "true");

    await chooseLanguage(page, "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('[data-testid="language-en"]:visible').first()).toHaveAttribute("aria-pressed", "true");
  });

  test("loads the game without uncaught console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/game");
    await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("links to the dedicated settings page", async ({ page }) => {
    const link = page.getByTestId("site-footer").getByRole("link", { name: "Settings" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expect(page.getByTestId("settings-panel")).toBeVisible();
  });

  test("hero copy fits narrow screens in both languages", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");

    const readOverflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await readOverflow()).toBeLessThanOrEqual(1);

    const heading = page.getByTestId("hero-title");
    const box = await heading.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(320);

    await chooseLanguage(page, "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await readOverflow()).toBeLessThanOrEqual(1);
  });

  test("has no horizontal overflow at a mobile viewport in either language", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const readOverflow = () =>
      page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));

    const initial = await readOverflow();
    expect(initial.document).toBeLessThanOrEqual(1);
    expect(initial.body).toBeLessThanOrEqual(1);

    await chooseLanguage(page, "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const rtl = await readOverflow();
    expect(rtl.document).toBeLessThanOrEqual(1);
    expect(rtl.body).toBeLessThanOrEqual(1);
  });
});
