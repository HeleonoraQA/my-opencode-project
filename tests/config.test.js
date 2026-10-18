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
});
