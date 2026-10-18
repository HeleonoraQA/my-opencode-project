import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultConfig = join(root, "opencode.json");

/**
 * Base policy every agent starts with (see OpenCode V2 permissions docs).
 * Later matching rules win, so config rules are appended after these.
 */
export const BASE_POLICY = [
  { action: "*", resource: "*", effect: "allow" },
  { action: "read", resource: "*.env", effect: "ask" },
  { action: "read", resource: "*.env.*", effect: "ask" },
  { action: "read", resource: "*.env.example", effect: "allow" },
];

export function loadPermissions(path = defaultConfig) {
  return JSON.parse(readFileSync(path, "utf8")).permissions ?? [];
}

function escapeLiteral(char) {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compile an OpenCode glob (`*` = any chars incl. `/`, `?` = one char) to a RegExp. */
export function compile(pattern) {
  let source = "";
  for (const char of pattern) {
    if (char === "*") source += ".*";
    else if (char === "?") source += ".";
    else source += escapeLiteral(char);
  }
  const flags = process.platform === "win32" ? "i" : "";
  return new RegExp(`^${source}$`, flags);
}

const normalize = (value) => value.replace(/\\/g, "/");

function actionMatches(action, pattern) {
  return compile(pattern).test(action);
}

function resourceMatches(action, resource, pattern) {
  if (compile(pattern).test(resource)) return true;
  // A shell pattern ending in " *" also matches the command without arguments.
  if (action === "shell" && pattern.endsWith(" *")) {
    return compile(pattern.slice(0, -2)).test(resource);
  }
  return false;
}

/** Resolve the effect (`allow` | `deny` | `ask`) for an action+resource pair. */
export function evaluate(action, resource, rules = []) {
  const value = normalize(resource);
  let effect = "ask";
  for (const rule of [...BASE_POLICY, ...rules]) {
    if (!actionMatches(action, rule.action)) continue;
    if (!resourceMatches(action, value, rule.resource)) continue;
    effect = rule.effect;
  }
  return effect;
}
