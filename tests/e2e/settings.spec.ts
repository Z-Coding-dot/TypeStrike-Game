import { expect, test } from "@playwright/test";

// Each test gets a fresh browser context, so defaults start clean without an
// init script that would also wipe storage on the reload we need to verify.
test("settings are available on a dedicated page and persist", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByTestId("settings-page")).toBeVisible();
  await expect(page.getByTestId("settings-panel")).toBeVisible();

  const sound = page.getByTestId("settings-sound");
  const speech = page.getByTestId("settings-speech");
  await expect(sound).toHaveAttribute("aria-checked", "true");
  await expect(speech).toHaveAttribute("aria-checked", "true");

  await sound.click();
  await speech.click();
  await expect(sound).toHaveAttribute("aria-checked", "false");
  await expect(speech).toHaveAttribute("aria-checked", "false");

  await page.reload();
  await expect(page.getByTestId("settings-sound")).toHaveAttribute("aria-checked", "false");
  await expect(page.getByTestId("settings-speech")).toHaveAttribute("aria-checked", "false");
});

test("language and mode preferences are edited only on the settings page", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("settings-panel").getByTestId("language-fa").first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByTestId("settings-panel").getByTestId("mode-letters").first().click();

  await page.goto("/game");
  await expect(page.getByTestId("game-page")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("mode-letters")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("typing-input")).toHaveAttribute("lang", "fa-AF");
});

test("restart from settings returns to a running game", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Restart" }).click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByTestId("game-menu")).toHaveCount(0);
  await expect(page.getByTestId("typing-input")).toBeAttached();
  await expect(page.getByTestId("game-scene")).toHaveAttribute("data-status", "playing");
});
