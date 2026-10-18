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
    ".opencode/skills/run-tests/SKILL.md",
    ".opencode/skills/lint/SKILL.md",
    ".husky/pre-commit",
    ".husky/pre-push",
    ".husky/commit-msg",
    ".github/workflows/ci.yml",
  ])("includes %s", (relative) => {
    expect(existsSync(path(relative))).toBe(true);
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
