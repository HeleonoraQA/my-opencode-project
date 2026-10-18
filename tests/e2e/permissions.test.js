import { describe, expect, it } from "vitest";
import { evaluate, loadPermissions } from "../../src/permissions.js";

const rules = loadPermissions();
const check = (action, resource) => evaluate(action, resource, rules);

describe("e2e: .env is fully blocked", () => {
  it.each([".env", "config/.env", "nested/dir/.env", "secrets/db.env"])(
    "denies reading %s",
    (target) => {
      expect(check("read", target)).toBe("deny");
    },
  );

  it.each([".env", "config/.env", "nested/dir/.env.production"])(
    "denies editing %s",
    (target) => {
      expect(check("edit", target)).toBe("deny");
    },
  );
});

describe("e2e: file edits require confirmation", () => {
  it.each(["src/permissions.js", "README.md", "docs/plan.md", "opencode.json"])(
    "asks before editing %s",
    (target) => {
      expect(check("edit", target)).toBe("ask");
    },
  );
});

describe("e2e: normal reads are allowed", () => {
  it.each(["src/permissions.js", "README.md", "AGENTS.md", "docs/about.md"])(
    "allows reading %s",
    (target) => {
      expect(check("read", target)).toBe("allow");
    },
  );
});

describe("e2e: shell policy", () => {
  it.each([
    "git status",
    "git status --short",
    "git push origin main",
    "git fetch",
    "npm test",
    "ls",
    "ls -la",
  ])("allows safe command: %s", (command) => {
    expect(check("shell", command)).toBe("allow");
  });

  it.each(["rm -rf build", "npm install", "curl http://example.com", "node script.js"])(
    "asks before command: %s",
    (command) => {
      expect(check("shell", command)).toBe("ask");
    },
  );
});

describe("e2e: rule ordering (last match wins)", () => {
  it("specific .env deny overrides the broad edit ask", () => {
    expect(check("edit", "app.env")).toBe("deny");
    expect(check("edit", "app.js")).toBe("ask");
  });

  it("negative: .env is not allowed for reads even though base allows reads", () => {
    expect(check("read", "config/.env")).not.toBe("allow");
  });
});
