import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = (relative) => join(root, relative);

describe("repository structure", () => {
  it.each([
    "AGENTS.md",
    "README.md",
    "rules.md",
    "opencode.json",
    "docs/plan.md",
    "docs/memory.md",
    "docs/about.md",
    "calculator.html",
    ".opencode/skills/run-tests/SKILL.md",
    ".opencode/skills/lint/SKILL.md",
    ".opencode/plugins/lint-and-guard/index.js",
    ".husky/pre-commit",
    ".husky/pre-push",
    ".husky/commit-msg",
    ".github/workflows/ci.yml",
  ])("includes %s", (relative) => {
    expect(existsSync(path(relative))).toBe(true);
  });
});

describe("calculator page", () => {
  const html = readFileSync(path("calculator.html"), "utf8");

  it("renders a display and a 20-key keypad", () => {
    expect(html).toContain('id="display"');
    expect(html.match(/<button/g)).toHaveLength(20);
  });

  it("declares an inline favicon and no external assets", () => {
    expect(html).toContain('rel="icon"');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
  });
});

describe("agent skills", () => {
  it.each(["run-tests", "lint"])("%s declares valid frontmatter", (name) => {
    const content = readFileSync(path(`.opencode/skills/${name}/SKILL.md`), "utf8");
    expect(content).toMatch(/^---\r?\n/);
    expect(content).toContain(`name: ${name}`);
    expect(content).toContain("description:");
  });
});
