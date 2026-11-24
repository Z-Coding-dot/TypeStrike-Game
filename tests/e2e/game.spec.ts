import { expect, test, type Page } from "@playwright/test";

const MODE_LABELS: Record<string, string> = {
  letters: "Letter Strike",
  words: "Word Strike",
  sentences: "Sentence Strike",
};

async function openGame(page: Page): Promise<void> {
  await page.goto("/game");
  await expect(page.getByTestId("game-page")).toBeVisible();
}

async function selectMode(page: Page, mode: keyof typeof MODE_LABELS): Promise<void> {
  const byTestId = page.locator(`[data-testid="mode-${mode}"]`);
  if (await byTestId.count()) {
    await byTestId.first().click();
    return;
  }
  await page.getByRole("button", { name: MODE_LABELS[mode] }).first().click();
}

async function startGame(page: Page, mode: keyof typeof MODE_LABELS): Promise<void> {
  await openGame(page);
  await selectMode(page, mode);
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("game-menu")).toHaveCount(0);
  await expect(page.getByTestId("typing-input")).toBeAttached();
  await expect(page.getByTestId("typing-input")).toBeFocused();
}

async function readStat(page: Page, name: "score" | "level" | "lives" | "shot-count" | "impact-count"): Promise<number> {
  const value = await page.getByTestId("game-scene").getAttribute(`data-${name}`);
  return Number(value ?? 0) || 0;
}

async function typeTarget(page: Page, text: string): Promise<void> {
  const input = page.getByTestId("typing-input");
  await input.focus();
  await page.keyboard.insertText(text);
}

/** Types a target and waits for the projectile to land and the score to settle. */
async function typeAndDestroy(page: Page, text: string): Promise<void> {
  const impactsBefore = await readStat(page, "impact-count");
  await typeTarget(page, text);
  await expect.poll(() => readStat(page, "impact-count")).toBe(impactsBefore + 1);
  await expect(page.getByTestId("typing-input")).toHaveValue("");
}

test("game starts without authentication", async ({ page }) => {
  await openGame(page);
  await expect(page.getByTestId("game-menu")).toBeVisible();
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await expect(page).not.toHaveURL(/login|signin/);
});

test("all three modes can be selected and started", async ({ page }) => {
  for (const mode of ["letters", "words", "sentences"] as const) {
    await startGame(page, mode);
    await expect(page.getByTestId("game-scene")).toBeVisible();
    await expect(page.getByTestId("typing-input")).toBeAttached();
  }
});

test("active HUD stays minimal and the typing input is unobtrusive", async ({ page }) => {
  await startGame(page, "words");

  for (const testId of ["hud-score", "hud-level", "hud-wpm", "hud-accuracy", "hud-timer", "hud-lives", "mode-indicator"]) {
    await expect(page.getByTestId(testId)).toHaveCount(0);
  }
  await expect(page.getByText("LANGUAGE", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("language-selector")).toHaveCount(1);
  await expect(page.getByTestId("pause-toggle")).toBeVisible();
  await expect(page.getByTestId("open-settings")).toHaveAttribute("href", "/settings");

  const inputClass = await page.getByTestId("typing-input").getAttribute("class");
  expect(inputClass).toContain("ts-sr-only");
  await expect(page.getByTestId("typing-card")).toHaveCount(0);
});

test("level completion advances to the next level", async ({ page }) => {
  await startGame(page, "words");
  await expect.poll(() => readStat(page, "level")).toBe(1);

  // Level 1 requires six destroyed word targets. Each shot is awaited so a
  // frozen target is never typed twice before its projectile lands.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if ((await page.getByTestId("level-complete").count()) > 0) break;
    const target = page.getByTestId("target-item").first();
    await expect(target).toBeVisible({ timeout: 20_000 });
    await typeAndDestroy(page, (await target.innerText()).trim());
  }

  await expect(page.getByTestId("level-complete")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("next-level").click();
  await expect.poll(() => readStat(page, "level")).toBe(2);
  await expect(page.getByTestId("level-complete")).toHaveCount(0);
  await expect(page.getByTestId("typing-input")).toBeAttached();
});

test("correct typing fires a visible shot before scoring on impact", async ({ page }) => {
  await startGame(page, "words");
  const target = page.getByTestId("target-item").first();
  await expect(target).toBeVisible({ timeout: 20_000 });
  const targetText = (await target.innerText()).trim();
  expect(targetText.length).toBeGreaterThan(0);

  const scoreBefore = await readStat(page, "score");
  const shotsBefore = await readStat(page, "shot-count");
  const impactsBefore = await readStat(page, "impact-count");

  await typeTarget(page, targetText);

  await expect.poll(() => readStat(page, "shot-count")).toBe(shotsBefore + 1);
  await expect.poll(() => readStat(page, "impact-count")).toBe(impactsBefore + 1);
  await expect.poll(() => readStat(page, "score")).toBeGreaterThan(scoreBefore);
  await expect(page.getByTestId("typing-input")).toHaveValue("");
});

test("shoot and impact sounds are requested as separate effects", async ({ page }) => {
  test.setTimeout(60_000);
  const requests: string[] = [];
  await page.route("**/sounds/effects/*.wav", async (route) => {
    requests.push(route.request().url().split("/").pop() ?? "");
    await route.continue();
  });

  await startGame(page, "words");
  const target = page.getByTestId("target-item").first();
  await expect(target).toBeVisible({ timeout: 20_000 });
  await typeAndDestroy(page, (await target.innerText()).trim());

  await expect.poll(() => requests.includes("shoot.wav")).toBe(true);
  await expect.poll(() => requests.includes("impact.wav")).toBe(true);
});

test("incorrect typing does not award points", async ({ page }) => {
  await startGame(page, "words");
  await expect(page.getByTestId("target-item").first()).toBeVisible({ timeout: 20_000 });
  const before = await readStat(page, "score");

  await typeTarget(page, "zzzzzz-definitely-not-a-target");
  await page.waitForTimeout(500);

  expect(await readStat(page, "score")).toBe(before);
});

test("targets reaching the ship remove a life, and three losses trigger game over", async ({ page }) => {
  test.setTimeout(120_000);
  await startGame(page, "letters");
  await expect.poll(() => readStat(page, "lives")).toBe(3);

  // Targets advance on Phaser's animation frames; no fake clock is needed.
  await expect.poll(() => readStat(page, "lives"), { timeout: 30_000 }).toBeLessThan(3);
  await expect.poll(() => page.getByTestId("results-overlay").count(), { timeout: 90_000 }).toBe(1);
  await expect.poll(() => readStat(page, "lives")).toBe(0);
});

test("typing focus returns after pause and after a stray keypress", async ({ page }) => {
  await startGame(page, "words");
  const input = page.getByTestId("typing-input");
  await expect(input).toBeFocused();

  await page.getByTestId("pause-toggle").click();
  await expect(page.getByTestId("pause-overlay")).toBeVisible();
  await expect(input).not.toBeFocused();

  await page.getByTestId("resume-game").click();
  await expect(page.getByTestId("pause-overlay")).toHaveCount(0);
  await expect(input).toBeFocused();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("a");
  await expect(input).toBeFocused();
});

test("restart resets score, lives and the input", async ({ page }) => {
  await openGame(page);
  await expect(page.getByTestId("start-game")).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("pause-toggle")).toBeEnabled();

  await page.getByTestId("pause-toggle").click();
  await expect(page.getByTestId("pause-overlay")).toBeVisible();
  await page.getByTestId("restart-game").click();

  await expect(page.getByTestId("pause-overlay")).toHaveCount(0);
  await expect.poll(() => readStat(page, "score")).toBe(0);
  await expect.poll(() => readStat(page, "lives")).toBe(3);
  await expect(page.getByTestId("typing-input")).toHaveValue("");
});

test("canvas reports a usable renderer and hides ad placeholder text", async ({ page }) => {
  await startGame(page, "words");
  const renderer = await page.getByTestId("game-scene").getAttribute("data-renderer");
  expect(["WebGL", "Canvas"]).toContain(renderer);

  // The reusable ad containers remain, but their placeholder label is only
  // exposed to assistive technology and is never painted on screen.
  const labels = page.getByText("Advertisement", { exact: true });
  const count = await labels.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const hidden = await labels.nth(index).evaluate((node) => {
      const box = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return box.width <= 1 && box.height <= 1 && style.overflow === "hidden";
    });
    expect(hidden).toBe(true);
  }
});
