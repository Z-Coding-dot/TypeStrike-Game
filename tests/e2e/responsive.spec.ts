import { expect, test, type Page } from "@playwright/test";

async function startFromMenu(page: Page): Promise<void> {
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("game-menu")).toHaveCount(0);
  await expect(page.getByTestId("typing-input")).toBeAttached();
}

async function overflow(page: Page): Promise<{ document: number; body: number }> {
  return page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
  }));
}

test("mobile viewport has no horizontal overflow and keeps controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/game");
  await startFromMenu(page);

  const space = await overflow(page);
  expect(space.document).toBeLessThanOrEqual(1);
  expect(space.body).toBeLessThanOrEqual(1);

  await expect(page.getByTestId("ad-sidebar-left")).toBeHidden();
  await expect(page.getByTestId("ad-sidebar-right")).toBeHidden();
  await expect(page.getByTestId("ad-bottom")).toBeVisible();
  await expect(page.getByTestId("game-scene")).toBeVisible();

  const input = page.getByTestId("typing-input");
  expect(await input.getAttribute("class")).toContain("ts-sr-only");
  await input.focus();
  await expect(input).toBeFocused();

  const keyboardButton = page.getByTestId("focus-keyboard");
  await expect(keyboardButton).toBeVisible();
  const keyboardBox = await keyboardButton.boundingBox();
  expect(keyboardBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  const pauseBox = await page.getByTestId("pause-toggle").boundingBox();
  expect(pauseBox?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("tablet hides side advertising while keeping the game centered", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/game");
  await expect(page.getByTestId("ad-sidebar-left")).toBeHidden();
  await expect(page.getByTestId("ad-sidebar-right")).toBeHidden();
  await expect(page.getByTestId("game-scene")).toBeVisible();

  const scene = await page.getByTestId("game-scene").boundingBox();
  expect(scene?.width ?? 0).toBeGreaterThan(600);
});

test("desktop uses side ad slots and a dominant center scene", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/game");
  await expect(page.getByTestId("ad-sidebar-left")).toBeVisible();
  await expect(page.getByTestId("ad-sidebar-right")).toBeVisible();

  const scene = await page.getByTestId("game-scene").boundingBox();
  const sidebar = await page.getByTestId("ad-sidebar-left").boundingBox();
  expect(scene?.width ?? 0).toBeGreaterThan((sidebar?.width ?? 0) * 2);
});

test("settings page fits narrow screens in both languages", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/settings");
  await expect(page.getByTestId("settings-page")).toBeVisible();
  await expect(page.getByTestId("settings-panel")).toBeVisible();

  let space = await overflow(page);
  expect(space.document).toBeLessThanOrEqual(1);
  expect(space.body).toBeLessThanOrEqual(1);

  await page.getByTestId("settings-panel").getByTestId("language-fa").first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  space = await overflow(page);
  expect(space.document).toBeLessThanOrEqual(1);
  expect(space.body).toBeLessThanOrEqual(1);
});

test("about page fits narrow screens in both languages", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/about");

  await expect(page.getByTestId("about-title")).toBeVisible();
  let space = await overflow(page);
  expect(space.document).toBeLessThanOrEqual(1);
  expect(space.body).toBeLessThanOrEqual(1);

  await page.locator('[data-testid="language-fa"]:visible').first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  space = await overflow(page);
  expect(space.document).toBeLessThanOrEqual(1);
  expect(space.body).toBeLessThanOrEqual(1);

  const titleBox = await page.getByTestId("about-title").boundingBox();
  expect(titleBox?.width ?? 0).toBeLessThanOrEqual(320);
});

test("mobile header keeps settings reachable from the collapsed menu", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  const header = page.getByTestId("site-header");
  await expect(header.getByRole("link", { name: "Settings" })).toHaveCount(0);

  await header.getByTestId("mobile-menu-toggle").click();
  const settingsLink = header.getByRole("link", { name: "Settings" });
  await expect(settingsLink).toBeVisible();
  await settingsLink.click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByTestId("settings-page")).toBeVisible();
});

test("overlays scroll instead of clipping on short screens", async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto("/game");
  await startFromMenu(page);
  await page.getByTestId("pause-toggle").click();

  const overlay = page.getByTestId("pause-overlay");
  await expect(overlay).toBeVisible();
  const scrollable = await overlay.evaluate((node) => getComputedStyle(node).overflowY);
  expect(scrollable).toBe("auto");
});
