import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const pkgVersion = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf8"),
).version;

test("calculator: arithmetic, errors and keyboard stay green", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const key = (name) => page.getByRole("button", { name, exact: true }).click();
  const display = page.getByTestId("display");
  const expression = page.getByTestId("expression");

  await page.goto("/calculator.html");
  await expect(page).toHaveTitle("Калькулятор");
  await expect(display).toHaveText("0");
  const about = page.getByTestId("about-line");
  await expect(about).toBeVisible();
  await expect(about).toContainText(`Калькулятор v${pkgVersion}`);
  await expect(about).toHaveAttribute("data-version", pkgVersion);

  // Дроби и округление: 9 ÷ 4 = 2,25
  await key("9");
  await key("Деление");
  await key("4");
  await key("Равно");
  await expect(expression).toHaveText("9 ÷ 4 =");
  await expect(display).toHaveText("2,25");

  // Деление на ноль даёт «Ошибка», а C возвращает ноль
  await key("Очистить");
  await key("5");
  await key("Деление");
  await key("0");
  await key("Равно");
  await expect(display).toHaveText("Ошибка");
  await key("Очистить");
  await expect(display).toHaveText("0");

  // Клавиатура: 7 * 6 Enter = 42
  await page.keyboard.press("7");
  await page.keyboard.press("*");
  await page.keyboard.press("6");
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("42");

  // Финальный сценарий для скриншота: 12,5 × 4 = 50
  await key("Очистить");
  await key("1");
  await key("2");
  await key("Десятичная точка");
  await key("5");
  await key("Умножение");
  await key("4");
  await key("Равно");
  await expect(expression).toHaveText("12,5 × 4 =");
  await expect(display).toHaveText("50");

  expect(consoleErrors).toEqual([]);

  await page.screenshot({
    path: "docs/screenshots/e2e-calculator.png",
    fullPage: true,
  });
});
