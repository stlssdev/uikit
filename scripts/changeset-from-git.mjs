#!/usr/bin/env node
/**
 * Draft a Changesets file from git history (commit subjects since a ref).
 * CHANGELOG.md is not read here — it is produced later by `changeset version`
 * (@changesets/changelog-github). This script only creates the *input* `.changeset/*.md`.
 *
 * Usage:
 *   node scripts/changeset-from-git.mjs
 *   pnpm prepare-release   # runs this script then `changeset version`
 *   node scripts/changeset-from-git.mjs --since v0.0.2
 *   node scripts/changeset-from-git.mjs --bump minor --max 50
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import process from "node:process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
}

function shOk(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const out = { since: null, bump: null, max: 200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--since" && argv[i + 1]) {
      out.since = argv[++i];
    } else if (a === "--bump" && argv[i + 1]) {
      out.bump = argv[++i];
    } else if (a === "--max" && argv[i + 1]) {
      out.max = Number(argv[++i]);
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

function inferBump(subjects) {
  for (const s of subjects) {
    if (/\bBREAKING CHANGE\b/i.test(s)) return "major";
    if (/^(\w+)(\([^)]*\))?!:|^[^:]+!:/.test(s)) return "major";
  }
  for (const s of subjects) {
    if (/^feat(\(|:)/.test(s)) return "minor";
  }
  return "patch";
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  process.stdout.write(
    [
      "Usage: node scripts/changeset-from-git.mjs [--since <git-ref>] [--bump patch|minor|major] [--max N]",
      "",
      "Creates .changeset/git-<random>.md using commit subjects (no merges) from:",
      "  --since <ref>   if set:  <ref>..HEAD",
      "  otherwise:      v<version> from package.json if that tag exists, else latest reachable tag,",
      "                  else last N commits on HEAD (see --max).",
      "",
      "Bump: --bump overrides; otherwise inferred from Conventional Commits (feat → minor, ! or BREAKING → major).",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const name = pkg.name;
const version = pkg.version;
if (!name || !version) {
  process.stderr.write("package.json must have name and version\n");
  process.exit(1);
}

let range = null;
let rangeLabel = "";

if (args.since) {
  if (!shOk(`git rev-parse --verify ${JSON.stringify(args.since)}`)) {
    process.stderr.write(`Unknown git ref for --since: ${args.since}\n`);
    process.exit(1);
  }
  range = `${args.since}..HEAD`;
  rangeLabel = range;
} else {
  const candidates = [`v${version}`, version];
  for (const c of candidates) {
    if (shOk(`git rev-parse --verify ${JSON.stringify(c)}`)) {
      range = `${c}..HEAD`;
      rangeLabel = range;
      break;
    }
  }
  if (!range) {
    const tag = sh("git describe --tags --abbrev=0 2>/dev/null") || "";
    if (tag && shOk(`git rev-parse --verify ${JSON.stringify(tag)}`)) {
      range = `${tag}..HEAD`;
      rangeLabel = range;
    }
  }
  if (!range) {
    const n = Number.isFinite(args.max) && args.max > 0 ? args.max : 50;
    range = `HEAD~${n}..HEAD`;
    rangeLabel = `HEAD~${n}..HEAD (no tag v${version} found — prefer tagging releases or pass --since <ref>)`;
  }
}

const max = Number.isFinite(args.max) && args.max > 0 ? args.max : 200;
let raw = "";
try {
  raw = sh(`git log ${range} --no-merges -n ${max} --pretty=format:%H%x09%s`).trim();
} catch (e) {
  process.stderr.write(`git log failed for range: ${range}\n`);
  process.stderr.write(String(e.stderr || e.message || e));
  process.stderr.write("\n");
  process.exit(1);
}

if (!raw) {
  process.stderr.write(`No commits found in range (${rangeLabel}). Nothing to record.\n`);
  process.exit(1);
}

const lines = raw.split("\n").filter(Boolean);
const entries = lines.map((line) => {
  const tab = line.indexOf("\t");
  const hash = tab === -1 ? "" : line.slice(0, tab);
  const subject = tab === -1 ? line : line.slice(tab + 1);
  return { hash: hash.slice(0, 7), subject };
});

const subjects = entries.map((e) => e.subject);
if (args.bump && !["patch", "minor", "major"].includes(args.bump)) {
  process.stderr.write(
    `Invalid --bump ${JSON.stringify(args.bump)} (use patch, minor, or major)\n`,
  );
  process.exit(1);
}

const inferred = inferBump(subjects);
const bump = args.bump ? args.bump : inferred;

const bullets = entries.map((e) => `- ${e.subject} (${e.hash})`).join("\n");
const body = [
  "Summary generated from git commit subjects.",
  "",
  `Range: ${rangeLabel}`,
  "",
  bullets,
  "",
].join("\n");

const id = randomBytes(4).toString("hex");
const fileName = `git-${id}.md`;
const fileContent = ["---", `"${name}": ${bump}`, "---", "", body, ""].join("\n");
const outPath = join(process.cwd(), ".changeset", fileName);
writeFileSync(outPath, fileContent, "utf8");

process.stdout.write(`Wrote ${join(".changeset", fileName)}\n`);
process.stdout.write(
  `Bump: ${bump} (${args.bump ? "from --bump" : `inferred; override with --bump`})\n`,
);
process.stdout.write(`Review/edit the file, then: git add .changeset && git commit …\n`);
