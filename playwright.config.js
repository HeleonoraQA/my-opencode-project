import { defineConfig } from "@playwright/test";

const PORT = 8123;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/ui",
  reporter: "list",
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 800 },
    launchOptions: { slowMo: Number(process.env.PW_SLOW_MO ?? 0) },
  },
  webServer: {
    command: "node tests/ui/server.mjs",
    url: `${baseURL}/calculator.html`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
});
