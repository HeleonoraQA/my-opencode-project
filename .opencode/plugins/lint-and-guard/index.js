/**
 * OpenCode V2 plugin: auto-lint edited files and block protected paths.
 *
 * The linter is spawned through `node` (see `nodeBinary`), because the OpenCode
 * server runs as its own binary (`opencode-cli.exe`), so `process.execPath`
 * cannot be used to execute JavaScript files.
 */
import { execFile } from "node:child_process";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { compile } from "../../../src/permissions.js";

const execFileAsync = promisify(execFile);

/** Tools whose input points at a file path. */
const FILE_TOOLS = new Set(["read", "edit", "write", "patch"]);

/** Tools that change a file and therefore trigger the linter. */
const MUTATING_TOOLS = new Set(["edit", "write", "patch"]);

// eslint.config.js covers only .js files, so other extensions are not linted.
const LINTABLE = /\.js$/i;

/** Same protected set as `permissions` and `policies` in opencode.json. */
export const PROTECTED_PATHS = ["*.env", "*.env.*", "*secrets/*", "*.key", "*.pem"];

const matchers = PROTECTED_PATHS.map((pattern) => compile(pattern));

/** `*.env` matches at any depth in OpenCode V2 (`*` spans `/`). */
export function isProtected(file) {
  if (typeof file !== "string" || file.length === 0) return false;
  const value = file.replace(/\\/g, "/").replace(/^\.\//, "");
  return matchers.some((matcher) => matcher.test(value));
}

/** Collect file paths from a tool input (`read`/`edit`/`write` use `filePath`). */
export function targetFiles(input) {
  if (input === null || typeof input !== "object") return [];
  return ["filePath", "path", "file"]
    .map((key) => input[key])
    .filter((value) => typeof value === "string" && value.length > 0);
}

function defaultExec(args, { cwd }) {
  const bin = join(cwd, "node_modules", "eslint", "bin", "eslint.js");
  return execFileAsync(nodeBinary(), [bin, ...args], { cwd, windowsHide: true });
}

/**
 * The OpenCode server is its own binary, so `process.execPath` is not Node:
 * spawning it with a script argument runs the OpenCode CLI instead. Only reuse
 * `execPath` when it really is Node, otherwise fall back to `node` on PATH.
 */
export function nodeBinary(execPath = process.execPath) {
  const name = basename(execPath.replace(/\\/g, "/"));
  return /^node(\.exe)?$/i.test(name) ? execPath : "node";
}

/**
 * OpenCode V2 plugin.
 *
 * Blocking is a defence-in-depth layer: the authoritative guard is the
 * `permissions` + `policies` deny rules in opencode.json, because a configured
 * deny never reaches a hook. This hook additionally stops path-based tool calls
 * before they run.
 */
export function createPlugin({ exec = defaultExec, cwd, onError } = {}) {
  let queue = Promise.resolve();

  return {
    id: "lint-and-guard",

    async setup(ctx) {
      const root = cwd ?? ctx?.location?.directory;

      await ctx.tool.hook("execute.before", (event) => {
        if (!FILE_TOOLS.has(event?.tool)) return;
        for (const file of targetFiles(event.input)) {
          if (!isProtected(file)) continue;
          throw new Error(
            `Blocked by lint-and-guard: ${file} is protected (.env, secrets/, *.key, *.pem).`,
          );
        }
      });

      await ctx.tool.hook("execute.after", (event) => {
        if (event?.status !== "completed") return;
        if (!MUTATING_TOOLS.has(event.tool)) return;
        if (!root) return;
        const files = targetFiles(event.input).filter(
          (file) => LINTABLE.test(file) && !isProtected(file),
        );
        if (files.length === 0) return undefined;
        queue = queue
          .then(() => lintFiles(files, root, exec))
          .catch((error) => (onError ?? reportError)(error));
        return queue;
      });
    },
  };
}

async function lintFiles(files, root, exec) {
  for (const file of files) {
    await exec(["--fix", file], { cwd: root });
  }
}

function reportError(error) {
  console.warn(`[lint-and-guard] eslint failed: ${error?.message ?? error}`);
}

export default createPlugin();
