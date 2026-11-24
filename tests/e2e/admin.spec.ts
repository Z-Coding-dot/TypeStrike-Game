import { expect, test } from "@playwright/test";

test("owner dashboard denies unauthenticated requests", async ({ request }) => {
  const response = await request.get("/admin");
  expect([401, 503]).toContain(response.status());
  expect(response.headers()["www-authenticate"]).toContain("Basic");
});

test("public game never requires authentication", async ({ page }) => {
  const response = await page.goto("/game");
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("typing-input")).toBeAttached();
});

test("owner dashboard fits narrow screens when authenticated", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 320, height: 720 },
    httpCredentials: { username: "playwright", password: "playwright" },
  });
  const page = await context.newPage();

  try {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("admin-layout")).toBeVisible();
    await expect(page.getByTestId("admin-unconfigured")).toBeVisible();

    const readOverflow = () =>
      page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));

    let space = await readOverflow();
    expect(space.document).toBeLessThanOrEqual(1);
    expect(space.body).toBeLessThanOrEqual(1);

    await page.locator('[data-testid="language-fa"]:visible').first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    space = await readOverflow();
    expect(space.document).toBeLessThanOrEqual(1);
    expect(space.body).toBeLessThanOrEqual(1);
  } finally {
    await context.close();
  }
});
