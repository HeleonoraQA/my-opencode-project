import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile, evaluate, loadPermissions, loadPolicies } from "../src/permissions.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = (relative) => join(root, relative);
const readJson = (relative) =>
  JSON.parse(readFileSync(path(relative), "utf8").replace(/^\uFEFF/, ""));

const LINT_HOOK = ".opencode/hooks/lint-on-file-changed.json";
const BLOCK_HOOK = ".opencode/hooks/block-protected-read.json";

const rules = loadPermissions();
const policies = loadPolicies();
const check = (action, resource) => evaluate(action, resource, rules, policies);

/** Concrete protected paths used to compare the hook layer with the config layer. */
const PROTECTED_SAMPLES = [
  ".env",
  "config/.env",
  "nested/dir/.env",
  "app.env.local",
  "secrets/db.json",
  "pkg/secrets/db.json",
  "certs/server.key",
  "certs/nested/server.pem",
];

/** Hook path filters use the same whole-value wildcards as permission rules. */
const hookMatches = (patterns, target) => patterns.some((pattern) => compile(pattern).test(target));

describe("hooks: lint on file changed", () => {
  const hook = readJson(LINT_HOOK);

  it("is enabled and reacts to file.changed", () => {
    expect(hook.enabled).toBe(true);
    expect(hook.event).toBe("file.changed");
  });

  it("runs the project lint script with autofix", () => {
    expect(hook.action.type).toBe("shell");
    const pkg = readJson("package.json");
    expect(pkg.scripts.lint).toBeDefined();
    expect(hook.action.command).toContain("npm run lint");
    expect(hook.action.command).toContain("--fix");
  });

  it("covers source and documentation files", () => {
    expect(hook.filters.include).toEqual(
      expect.arrayContaining(["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.json", "**/*.md"]),
    );
  });

  it("ignores dependencies and git internals", () => {
    expect(hook.filters.exclude).toEqual(
      expect.arrayContaining(["node_modules/**", ".git/**"]),
    );
  });
});

describe("hooks: block protected reads and edits", () => {
  const hook = readJson(BLOCK_HOOK);

  it("is enabled and intercepts tool calls", () => {
    expect(hook.enabled).toBe(true);
    expect(hook.event).toBe("tool.before.*");
    expect(hook.action.type).toBe("stop");
  });

  it("covers every file operation", () => {
    expect(hook.filters.tools).toEqual(
      expect.arrayContaining(["read", "edit", "write", "patch"]),
    );
  });

  it.each(PROTECTED_SAMPLES)("blocks %s", (target) => {
    expect(hookMatches(hook.filters.paths, target)).toBe(true);
  });

  it("does not block ordinary project files", () => {
    for (const target of ["README.md", "src/permissions.js", "docs/plan.md"]) {
      expect(hookMatches(hook.filters.paths, target)).toBe(false);
    }
  });
});

describe("hooks: parity with opencode.json", () => {
  const hook = readJson(BLOCK_HOOK);

  it("uses the same protected path set as the deny rules", () => {
    const denied = configDeniedResources();
    expect([...hook.filters.paths].sort()).toEqual([...denied].sort());
  });

  it.each(PROTECTED_SAMPLES)("config also denies %s", (target) => {
    expect(check("read", target)).toBe("deny");
    expect(check("edit", target)).toBe("deny");
  });

  it("does not deny anything the hook allows", () => {
    for (const target of ["README.md", "src/permissions.js", "docs/about.md", "opencode.json"]) {
      expect(check("read", target)).not.toBe("deny");
      expect(check("edit", target)).not.toBe("deny");
    }
  });
});

/** Resources denied by `read` rules in opencode.json. */
function configDeniedResources() {
  return rules
    .filter((rule) => rule.action === "read" && rule.effect === "deny")
    .map((rule) => rule.resource)
    .sort();
}
