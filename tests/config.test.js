import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(join(root, relative), "utf8");

describe("opencode.json", () => {
  const config = JSON.parse(read("opencode.json"));

  it("uses the published schema", () => {
    expect(config.$schema).toBe("https://opencode.ai/config.json");
  });

  it("loads rules.md as an instruction file", () => {
    expect(config.instructions).toContain("rules.md");
  });

  it("uses the V2 permissions array without the deprecated permission object", () => {
    expect(Array.isArray(config.permissions)).toBe(true);
    expect(config.permission).toBeUndefined();
  });

  it("denies reading and editing .env files", () => {
    expect(config.permissions).toEqual(
      expect.arrayContaining([
        { action: "read", resource: "*.env", effect: "deny" },
        { action: "read", resource: "*.env.*", effect: "deny" },
        { action: "edit", resource: "*.env", effect: "deny" },
        { action: "edit", resource: "*.env.*", effect: "deny" },
      ]),
    );
  });

  it.each(["*.env", "*.env.*", "*secrets/*", "*.key", "*.pem"])(
    "denies %s for read and edit at any depth",
    (resource) => {
      expect(config.permissions).toEqual(
        expect.arrayContaining([
          { action: "read", resource, effect: "deny" },
          { action: "edit", resource, effect: "deny" },
        ]),
      );
    },
  );

  it.each(["*.env", "*.env.*", "*secrets/*", "*.key", "*.pem"])(
    "hard-denies %s through a tool.use policy",
    (resource) => {
      expect(config.policies).toEqual(
        expect.arrayContaining([
          { action: "tool.use", resource: `read:${resource}`, effect: "deny" },
          { action: "tool.use", resource: `edit:${resource}`, effect: "deny" },
        ]),
      );
    },
  );

  it("asks before editing files", () => {
    expect(config.permissions).toContainEqual({
      action: "edit",
      resource: "*",
      effect: "ask",
    });
  });

  it("asks before shell commands except a safe allowlist", () => {
    const shell = config.permissions.filter((rule) => rule.action === "shell");
    expect(shell[0]).toEqual({ action: "shell", resource: "*", effect: "ask" });
    const allowed = shell
      .filter((rule) => rule.effect === "allow")
      .map((rule) => rule.resource);
    expect(allowed).toEqual(expect.arrayContaining(["git *", "npm test", "ls *"]));
  });

  it("configures the Playwright MCP server as a local command", () => {
    const server = config.mcp?.servers?.playwright;
    expect(server).toMatchObject({ type: "local", cwd: "." });
    expect(server.command.slice(0, 4)).toEqual([
      "npx",
      "-y",
      "@playwright/mcp@latest",
      "--browser",
    ]);
    expect(server.command).toContain("chrome");
  });

  it("denies the RCE-equivalent Playwright code tool", () => {
    expect(config.permissions).toContainEqual({
      action: "playwright_browser_run_code_unsafe",
      resource: "*",
      effect: "deny",
    });
  });
});
