import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // UI-тесты Playwright запускаются отдельно через `npm run test:ui`.
    exclude: [...configDefaults.exclude, "tests/ui/**"],
  },
});
