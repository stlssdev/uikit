# Contributing

## Tooling

| Script             | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `pnpm storybook`   | Storybook dev server (port 6006)                                         |
| `pnpm build`       | Library bundle + `dist/style.css`                                        |
| `pnpm validate`    | Format check, oxlint, TypeScript, `build`, static Storybook (same as CI) |
| `pnpm release`     | `changeset publish` (`prepublishOnly` runs `build`)                      |
| `pnpm release:otp` | Prompt for npm OTP, then `changeset publish --otp` (2FA-friendly)        |

Other CLIs are run via **`pnpm exec`** (no package script): e.g. **`pnpm exec changeset`** (add a changeset), **`pnpm exec changeset version`** (bump version + changelog from changesets), **`pnpm exec oxfmt .`**, **`pnpm exec oxlint . --fix`**.

## Git hooks (Husky)

On `pnpm install`, Husky installs hooks from `.husky/`.

- **pre-commit** (`.husky/pre-commit`): three logged steps — staged **format check** (`pnpm exec lint-staged` + `.lintstagedrc.format.json`) → whole-repo **`pnpm exec tsc --noEmit`** → staged **lint** (`lint-staged` + `.lintstagedrc.lint.json`). Nothing auto-writes; fix locally and re-stage.
- **commit-msg** (`.husky/commit-msg`): **Commitlint** (Conventional Commits), separate hook after tree checks.

Configs: [`.lintstagedrc.format.json`](.lintstagedrc.format.json), [`.lintstagedrc.lint.json`](.lintstagedrc.lint.json).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example:

- `feat(button): add loading state`
- `fix: correct focus ring contrast`
- `chore: bump devDependencies`
- `docs: update README install`

## Releases and changelog

### Automated (recommended): GitHub Actions + Changesets

On every push to **`main`**, [`.github/workflows/release.yml`](.github/workflows/release.yml) runs [`changesets/action`](https://github.com/changesets/action):

1. If there are **pending changeset files** (`.changeset/*.md`), it opens a PR titled **“chore: release package”** that bumps **`package.json`** and updates **`CHANGELOG.md`** (you merge that PR).
2. After that merge, when there are **no** pending changesets but the version on `main` is **not yet published**, it runs **`pnpm validate && changeset publish`**, publishes to **npm**, and creates a **GitHub Release** (`createGithubReleases: true`). Provenance is enabled via **`NPM_CONFIG_PROVENANCE`**.

**Repository secrets** (Settings → Secrets and variables → Actions):

| Secret      | Purpose                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN` | Granular npm access token with **publish** permission for `@stlssdev/uikit` (automation-style token; bypasses interactive OTP in CI). |

`GITHUB_TOKEN` is supplied by Actions; the workflow sets **`contents:write`**, **`pull-requests:write`**, and **`id-token:write`** (for npm provenance).

**Day-to-day:** merge features to `main`, then run **`pnpm exec changeset`** on a branch (or locally and push), open a PR with the new `.changeset/*.md`, merge it. The release workflow then opens the **version** PR; merge that. The next workflow run **publishes** and creates the GitHub release.

### Manual (local npm)

1. Merge work to **`main`** (with CI green).
2. **`pnpm exec changeset`** — pick semver level and describe the change; commit the new `.changeset/*.md`.
3. **`pnpm exec changeset version`** — updates version(s) and **CHANGELOG.md** from changesets.
4. **`pnpm release`** — `changeset publish` ( **`prepublishOnly`** runs **`pnpm build`** before the tarball is packed).

Changelog entries use **`@changesets/changelog-github`** (PR/commit links when the tooling runs in a GitHub context).

## Node / pnpm

This repo pins **`packageManager`** in `package.json`. Enable [Corepack](https://nodejs.org/api/corepack.html) so your shell uses the same pnpm:

```bash
corepack enable
```

## Publishing note (Husky + npm)

`prepare` is set to **`husky || exit 0`**. In this repository, `pnpm install` runs Husky and wires Git hooks. When someone installs `@stlssdev/uikit` from npm, `husky` is not shipped, the command no-ops, and **install still succeeds**.

## Publishing & npm troubleshooting

### Before you publish

1. **`npm whoami`** — confirm you are on the npm account that is allowed to publish `@stlssdev/*`.
2. **Org access** — that user must be on the **`stlssdev`** org with permission to publish packages ([Members](https://www.npmjs.com/org/stlssdev/members)). If you are an **owner** but still get **401**, check **OTP / 2FA** (below) before assuming a membership bug.
3. **Dry run (local)** — `pnpm build && npm pack --dry-run` to confirm the tarball contents without hitting the registry.

### If you see `401` on `PUT …/@stlssdev%2fuikit`

- **Confirm org access** (CLI): `npm org ls <org>` — e.g. `npm org ls stlssdev` should list your user as **`owner`** if you control the scope.
- **2FA (`auth-and-writes`)** — npm expects a **one-time password** for publishes. If your tool opens **web auth** and then fails with **401** before you can finish, use one of the flows below so the CLI **waits for OTP** (or uses a token) instead of failing immediately.

#### Interactive OTP (recommended locally)

After versioning (changesets applied), run:

```bash
pnpm release:otp
```

This **prompts for your OTP** in the terminal, then runs **`changeset publish --otp …`**. **`prepublishOnly`** still runs **`pnpm build`** during publish. Use a normal terminal (TTY); Cursor’s integrated terminal is fine.

You can also pass OTP once via env (no prompt):

```bash
pnpm build
NPM_OTP=123456 node scripts/publish-with-otp.mjs
```

Manual equivalent:

```bash
pnpm build
pnpm exec changeset publish --otp 123456
```

(`changeset publish --help` documents `--otp`.)

#### Full automation (CI / no human OTP)

Create a **granular access token** on npm ([Access Tokens](https://www.npmjs.com/settings/~/tokens)) with **Publish** for `@stlssdev/uikit` (or the org) and permission to **bypass 2FA** when npm allows it for that token type. Store it as a **GitHub Actions secret** (e.g. `NPM_TOKEN`) and set before publish:

```bash
npm config set //registry.npmjs.org/:_authToken="${NPM_TOKEN}"
pnpm exec changeset publish
```

Exact token capabilities depend on npm’s current policy; prefer **automation**-oriented tokens for CI. If the CLI session is wrong, run **`npm login`** again (or set `//registry.npmjs.org/:_authToken` in `~/.npmrc` from a token you created on npmjs.com).

- Do not use **`npm publish --ignore-scripts`** unless you mean to: it skips **`prepublishOnly`**, so you can publish without rebuilding (risky if the tarball was built elsewhere).

### `Exit handler never called` from npm

That message is often **npm’s own flaky logging** after another error (e.g. 401). Fix the **401** first; upgrading npm (`npm i -g npm@latest`) can reduce noise.
