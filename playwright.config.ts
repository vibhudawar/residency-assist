import { defineConfig } from "@playwright/test";

// The tests play every part (applicant, assistant, ElevenLabs, officer) against the real database,
// so they need the same .env as the app. Run with `pnpm test:e2e` (dev server on :3006).
try {
  process.loadEnvFile(".env");
} catch {
  // CI provides the variables directly.
}

export default defineConfig({
  testDir: "e2e",
  // One shared demo database: run the flows one after another, each from a fresh demo.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["./e2e/evidence-reporter.ts"]],
  globalTeardown: "./e2e/teardown.ts",
  outputDir: "test-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3006",
    channel: "chrome", // the installed Chrome; no browser download
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: "en-GB",
    timezoneId: "Asia/Dubai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
