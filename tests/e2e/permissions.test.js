import { describe, expect, it } from "vitest";
import { evaluate, loadPermissions, loadPolicies } from "../../src/permissions.js";

const rules = loadPermissions();
const policies = loadPolicies();
const check = (action, resource) => evaluate(action, resource, rules, policies);

/** Protected paths at any nesting depth. */
const PROTECTED_PATHS = [
  ".env",
  "app.env",
  "config/.env",
  "nested/dir/.env",
  "secrets/db.env",
  "app.env.local",
  "nested/dir/.env.production",
  "secrets/db.json",
  "pkg/secrets/db.json",
  "certs/server.key",
  "certs/nested/server.pem",
];

describe("e2e: protected paths are denied at any depth", () => {
  it.each(PROTECTED_PATHS)("denies reading %s", (target) => {
    expect(check("read", target)).toBe("deny");
  });

  it.each(PROTECTED_PATHS)("denies editing %s", (target) => {
    expect(check("edit", target)).toBe("deny");
  });
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

describe("e2e: policy layer hard-denies protected paths", () => {
  it("denies a read even when a later permission rule allows it", () => {
    const permissive = [{ action: "read", resource: "*.env", effect: "allow" }];
    expect(evaluate("read", ".env", permissive, policies)).toBe("deny");
    expect(evaluate("read", "config/.env", permissive, policies)).toBe("deny");
  });

  it("denies an edit even when a later permission rule allows it", () => {
    const permissive = [{ action: "edit", resource: "*.env", effect: "allow" }];
    expect(evaluate("edit", ".env", permissive, policies)).toBe("deny");
  });

  it("keeps unrelated paths untouched", () => {
    expect(evaluate("read", "README.md", [], policies)).not.toBe("deny");
    expect(evaluate("edit", "src/permissions.js", [], policies)).not.toBe("deny");
  });
});
