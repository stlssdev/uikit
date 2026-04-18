#!/usr/bin/env node
/**
 * Waits for an npm OTP, then runs `changeset publish --otp …` so publish does not fail
 * with 401 before you can type a code (non-interactive / web-auth flows).
 *
 * Usage:
 *   pnpm release:otp
 *   node scripts/publish-with-otp.mjs
 *   NPM_OTP=123456 node scripts/publish-with-otp.mjs   # no prompt (CI / paste once)
 *
 * `prepublishOnly` runs `pnpm build` during `changeset publish`, so you do not need a separate build step.
 *
 * Extra args are forwarded to `changeset publish`, e.g.:
 *   node scripts/publish-with-otp.mjs --tag next
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { spawnSync } from "node:child_process";

let otp = process.env.NPM_OTP?.trim();

if (!otp) {
  if (!stdin.isTTY) {
    stdout.write(
      'No TTY on stdin. Set NPM_OTP for a one-shot publish, e.g.:\n  NPM_OTP=123456 pnpm exec changeset publish --otp "$NPM_OTP"\n',
    );
    process.exit(1);
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  otp = (await rl.question("Enter npm OTP (6–8 digits from your authenticator): ")).trim();
  await rl.close();
}

if (!/^\d{6,8}$/.test(otp)) {
  stdout.write("Expected a 6–8 digit numeric OTP.\n");
  process.exit(1);
}

const passthrough = process.argv.slice(2);
const publishArgs = ["exec", "changeset", "publish", "--otp", otp, ...passthrough];

const result = spawnSync("pnpm", publishArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status === 0 ? 0 : (result.status ?? 1));
