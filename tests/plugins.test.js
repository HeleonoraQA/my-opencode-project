import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";
import plugin, {
  createPlugin,
  isProtected,
  targetFiles,
} from "../.opencode/plugins/lint-and-guard/index.js";

const ROOT = "/project";

function fakeContext() {
  const hooks = {};
  return {
    hooks,
    ctx: {
      location: { directory: ROOT },
      tool: {
        hook: async (name, callback) => {
          hooks[name] = callback;
          return { dispose: async () => {} };
        },
      },
    },
  };
}

async function setupPlugin(options = {}) {
  const exec = vi.fn(async () => {});
  const instance = createPlugin({ exec, cwd: ROOT, ...options });
  const { ctx, hooks } = fakeContext();
  await instance.setup(ctx);
  return { instance, hooks, exec };
}

const before = (hooks, event) => hooks["execute.before"](event);
const after = (hooks, event) => hooks["execute.after"](event);

describe("plugin: definition", () => {
  it("exports a V2 plugin with id and setup", () => {
    expect(plugin.id).toBe("lint-and-guard");
    expect(typeof plugin.setup).toBe("function");
  });

  it("registers both tool hooks", async () => {
    const { hooks } = await setupPlugin();
    expect(Object.keys(hooks).sort()).toEqual(["execute.after", "execute.before"]);
  });
});

describe("plugin: protected path guard", () => {
  it.each([
    ".env",
    "config/.env",
    "nested/dir/.env",
    "app.env.local",
    "secrets/db.json",
    "pkg/secrets/db.json",
    "certs/server.key",
    "certs/nested/server.pem",
  ])("blocks file tools on %s", async (file) => {
    const { hooks } = await setupPlugin();
    expect(() => before(hooks, { tool: "read", input: { filePath: file } })).toThrow(/protected/);
    expect(() => before(hooks, { tool: "edit", input: { filePath: file } })).toThrow(/protected/);
  });

  it("normalizes Windows paths", async () => {
    const { hooks } = await setupPlugin();
    expect(() =>
      before(hooks, { tool: "edit", input: { filePath: "C:\\repo\\config\\.env" } }),
    ).toThrow(/protected/);
  });

  it("allows ordinary project files", async () => {
    const { hooks } = await setupPlugin();
    for (const file of ["README.md", "src/permissions.js", "docs/plan.md"]) {
      expect(() => before(hooks, { tool: "read", input: { filePath: file } })).not.toThrow();
    }
  });

  it("ignores tools without a file path", async () => {
    const { hooks } = await setupPlugin();
    expect(() => before(hooks, { tool: "shell", input: { command: "cat .env" } })).not.toThrow();
    expect(() => before(hooks, { tool: "glob", input: { pattern: "**/.env" } })).not.toThrow();
  });

  it("matches protected paths at any depth", () => {
    expect(isProtected("/project/config/.env")).toBe(true);
    expect(isProtected("./secrets/id.json")).toBe(true);
    expect(isProtected("docs/screenshot.png")).toBe(false);
  });
});

describe("plugin: lint after edits", () => {
  it.each(["src/app.js", "src/lib.mjs", "scripts/tool.cjs", "package.json", "README.md"])(
    "lints %s after a completed edit",
    async (file) => {
      const { hooks, exec } = await setupPlugin();
      await after(hooks, { tool: "edit", status: "completed", input: { filePath: file } });
      expect(exec).toHaveBeenCalledWith(["--fix", file], { cwd: ROOT });
    },
  );

  it("skips non-lintable files", async () => {
    const { hooks, exec } = await setupPlugin();
    await after(hooks, { tool: "edit", status: "completed", input: { filePath: "logo.png" } });
    expect(exec).not.toHaveBeenCalled();
  });

  it("skips failed and non-mutating tools", async () => {
    const { hooks, exec } = await setupPlugin();
    await after(hooks, { tool: "edit", status: "error", input: { filePath: "src/app.js" } });
    await after(hooks, { tool: "read", status: "completed", input: { filePath: "src/app.js" } });
    expect(exec).not.toHaveBeenCalled();
  });

  it("never lints protected files", async () => {
    const { hooks, exec } = await setupPlugin();
    await after(hooks, { tool: "edit", status: "completed", input: { filePath: ".env" } });
    expect(exec).not.toHaveBeenCalled();
  });

  it("ignores patch input without a file path", async () => {
    const { hooks, exec } = await setupPlugin();
    await after(hooks, {
      tool: "patch",
      status: "completed",
      input: { patchText: "*** Begin Patch" },
    });
    expect(exec).not.toHaveBeenCalled();
  });

  it("serializes concurrent lint runs", async () => {
    let active = 0;
    let maxActive = 0;
    const exec = vi.fn(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(5);
      active -= 1;
    });
    const instance = createPlugin({ exec, cwd: ROOT });
    const { ctx, hooks } = fakeContext();
    await instance.setup(ctx);

    await Promise.all([
      after(hooks, { tool: "edit", status: "completed", input: { filePath: "a.js" } }),
      after(hooks, { tool: "edit", status: "completed", input: { filePath: "b.js" } }),
    ]);

    expect(exec).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
  });

  it("reports lint failures without breaking the session", async () => {
    const onError = vi.fn();
    const exec = vi.fn(async () => {
      throw new Error("eslint failed");
    });
    const instance = createPlugin({ exec, cwd: ROOT, onError });
    const { ctx, hooks } = fakeContext();
    await instance.setup(ctx);

    await expect(
      after(hooks, { tool: "edit", status: "completed", input: { filePath: "src/app.js" } }),
    ).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledOnce();
  });
});

describe("plugin: targetFiles", () => {
  it("reads filePath, path and file keys", () => {
    expect(targetFiles({ filePath: "a.js", path: "b.js", file: "c.js" })).toEqual([
      "a.js",
      "b.js",
      "c.js",
    ]);
  });

  it("ignores missing or non-string values", () => {
    expect(targetFiles(undefined)).toEqual([]);
    expect(targetFiles({ filePath: 42, path: null })).toEqual([]);
  });
});
