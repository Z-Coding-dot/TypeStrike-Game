import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
// Use locally installed Chrome by default because the Playwright headless
// shell is not downloadable in every environment. Set PLAYWRIGHT_CHANNEL=chromium
// to run against a bundled browser installed with `npx playwright install chromium`.
const channel = (process.env.PLAYWRIGHT_CHANNEL ?? "chrome") as "chrome" | "chromium";

export default defineConfig({
  testDir: "./tests/e2e",
  // Phaser/WebGL pages are resource-heavy; serial execution keeps the dev
  // server and browser contexts stable on constrained machines.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "en-US",
    channel,
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Deterministic credentials for the authenticated dashboard test; real
    // deployments still supply their own ADMIN_USERNAME / ADMIN_PASSWORD.
    env: {
      ...process.env,
      ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? "playwright",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "playwright",
    },
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
});
