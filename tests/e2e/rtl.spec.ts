import { expect, test, type Page } from "@playwright/test";

function parseScore(text: string | null): number {
  const value = text ?? "0";
  const ascii = value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
  return Number(ascii.replace(/[^\d]/g, "")) || 0;
}

async function choosePersian(page: Page): Promise<void> {
  const visible = page.locator('[data-testid="language-fa"]:visible');
  if (await visible.count()) {
    await visible.first().click();
    return;
  }
  await page.getByText("دری", { exact: true }).first().click();
}

async function score(page: Page): Promise<number> {
  return parseScore(await page.getByTestId("game-scene").getAttribute("data-score"));
}

test("Persian selection switches the document and game input to RTL", async ({ page }) => {
  await page.goto("/game");
  await expect(page.getByTestId("game-menu")).toBeVisible();

  await choosePersian(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa-AF");

  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();
  const input = page.getByTestId("typing-input");
  await expect(input).toBeAttached();
  await expect(input).toHaveAttribute("dir", "rtl");
  await expect(input).toHaveAttribute("lang", "fa-AF");
  await expect(page.getByTestId("game-page")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("game-page")).toHaveAttribute("lang", "fa-AF");
});

test("Persian target text is preserved and matched grapheme by grapheme", async ({ page }) => {
  await page.goto("/game");
  await choosePersian(page);
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();

  const target = page.getByTestId("target-item").first();
  await expect(target).toBeVisible({ timeout: 20_000 });
  const targetText = (await target.innerText()).trim();
  expect(targetText).toMatch(/[\u0600-\u06FF]/);

  const input = page.getByTestId("typing-input");
  const scoreBefore = await score(page);
  await input.focus();

  // A partial Persian prefix must survive unchanged in the RTL input; a fully
  // matched target is consumed and the input is cleared by the game.
  const firstGrapheme = Array.from(targetText)[0] ?? targetText;
  await page.keyboard.insertText(firstGrapheme);
  await expect(input).toHaveValue(firstGrapheme);

  await page.keyboard.insertText(targetText.slice(firstGrapheme.length));
  await expect(input).toHaveValue("");
  await expect.poll(() => score(page)).toBeGreaterThan(scoreBefore);
});

test("English mode still matches English targets after switching back", async ({ page }) => {
  await page.goto("/game");
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();

  const target = page.getByTestId("target-item").first();
  await expect(target).toBeVisible({ timeout: 20_000 });
  const targetText = (await target.innerText()).trim();
  expect(targetText).toMatch(/^[A-Za-z]+$/);

  const input = page.getByTestId("typing-input");
  const scoreBefore = await score(page);
  await input.focus();
  await page.keyboard.insertText(targetText);
  await expect.poll(() => score(page)).toBeGreaterThan(scoreBefore);
});
