// Bumps a plugin's version: node scripts/bump-version.mjs <plugin> <patch|minor|major>
//
// The version lives in plugins/<plugin>/.claude-plugin/plugin.json only (the marketplace entry has
// none, so the two cannot disagree). Only the "version" value is rewritten, the file keeps its
// layout. Prints the new version.

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [plugin, type] = process.argv.slice(2);
const KINDS = ["major", "minor", "patch"];
if (!plugin || !KINDS.includes(type)) {
  console.error("Usage: node scripts/bump-version.mjs <plugin> <patch|minor|major>");
  process.exit(2);
}

const path = `plugins/${plugin}/.claude-plugin/plugin.json`;
if (!existsSync(path)) {
  console.error(`No such plugin: ${path} is missing`);
  process.exit(1);
}
const source = readFileSync(path, "utf8");
const current = JSON.parse(source).version;
if (!/^\d+\.\d+\.\d+$/.test(current ?? "")) {
  console.error(`${path}: "version" must be x.y.z, found ${JSON.stringify(current)}`);
  process.exit(1);
}

// patch: 0.1.0 -> 0.1.1, minor: 0.1.1 -> 0.2.0, major: 0.2.0 -> 1.0.0.
const parts = current.split(".").map(Number);
const at = KINDS.indexOf(type);
const next = parts.map((n, i) => (i < at ? n : i === at ? n + 1 : 0)).join(".");

writeFileSync(path, source.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`));
console.log(next);
