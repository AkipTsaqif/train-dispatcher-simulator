import { defineConfig, devices } from "@playwright/test";

/**
 * ppka-demo is a visual-first app: the whole product is one SVG dispatching
 * table. Playwright is used for BOTH functional interaction tests and
 * screenshot-based visual regression (baselines committed under
 * tests/dispatching-table.spec.ts-snapshots/).
 *
 * Tests run against a PRODUCTION build on a dedicated port (3100): the prod
 * output is what users actually see (no Next dev-tools overlay), and it never
 * collides with the developer's own dev server (currently on 3000).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  expect: {
    // Deterministic screenshots: no hover/transition animations, no caret.
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "bun run build && bun run start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
