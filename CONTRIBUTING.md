# Contributing

## Tooling

| Script                 | Purpose                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm storybook`       | Storybook dev server (port 6006)                                                                                                                                                                                                                 |
| `pnpm build`           | Library bundle + `dist/style.css`                                                                                                                                                                                                                |
| `pnpm validate`        | Format check, TypeScript, oxlint, **`pnpm build`**, static Storybook (same as CI)                                                                                                                                                                |
| `pnpm prepare-release` | Runs **[`scripts/changeset-from-git.mjs`](scripts/changeset-from-git.mjs)** then **`changeset version`**. To tweak summaries, run **`node scripts/changeset-from-git.mjs`**, edit **`.changeset/*.md`**, then **`pnpm exec changeset version`**. |
| `pnpm release`         | **`changeset publish`** (`prepublishOnly` runs **`build`**) — **emergency local publish** only; normal releases use **CI** after you push a tag (see [Releases and changelog](#releases-and-changelog)).                                         |

Other CLIs are run via **`pnpm exec`**: **`pnpm exec changeset`** (interactive wizard), **`pnpm exec changeset version`** (same as the second half of **`prepare-release`**), **`pnpm exec oxfmt .`**, **`pnpm exec oxlint . --fix`**.

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

### How `CHANGELOG.md` is updated

- When **`changeset version`** runs (the second step of **`pnpm prepare-release`**, or **`pnpm exec changeset version`**), Changesets **rewrites `CHANGELOG.md`** for the new version using the summaries from **`.changeset/*.md`**. With **`@changesets/changelog-github`** (see [`.changeset/config.json`](.changeset/config.json)), entries get **PR/commit links** when that command runs in a **GitHub** context (for example locally with a normal clone of this repo).
- **[`scripts/changeset-from-git.mjs`](scripts/changeset-from-git.mjs) does not read `CHANGELOG.md`.** It only uses **git history** to draft the _next_ pending changeset file. `CHANGELOG.md` is an **output** of the release tooling, not its input.

### Release model (tag-gated + approval)

Releases **do not** publish on every merge to **`main`**. Publishing runs only after you push a **semver tag** that matches **`package.json`**, and the **publish** job is gated by a **GitHub Environment** so a maintainer must **approve** the deployment before npm OIDC publish runs.

**Maintainer flow:**

1. **Draft changeset + bump version (local):** from a branch off **`main`**, run **`pnpm prepare-release`**, or run **`node scripts/changeset-from-git.mjs`**, optionally **edit** `.changeset/*.md`, then **`pnpm exec changeset version`**. Commit **`package.json`**, **`CHANGELOG.md`**, and any removed `.changeset/` files; open a **PR** and merge to **`main`**.
2. **Tag the release commit:** create **`vX.Y.Z`** on the merge commit (GitHub **Releases** UI or **`git tag vX.Y.Z && git push origin vX.Y.Z`**). The tag must match **`package.json`** `version` (for example tag **`v1.2.3`** for version **`1.2.3`**).
3. **Approve CI:** [`.github/workflows/release.yml`](.github/workflows/release.yml) runs on the tag. The **`publish`** job uses **`environment: npm`** and **waits for required reviewers**. After approval, CI runs **`pnpm exec changeset publish`** (Trusted Publishing / OIDC) and creates a **GitHub Release** ( **`gh release create`** with **`--generate-notes`**; skipped if the release already exists, for safe re-runs).

**Re-run a failed publish** without a new tag: run the **Release** workflow manually (**Actions → Release → Run workflow**) and enter the same **`vX.Y.Z`** tag.

### One-time GitHub: Environment `npm` (approval gate)

1. Repo **Settings → Environments → New environment** → name **`npm`** (must match the workflow job and, if set, npm Trusted Publisher).
2. Enable **Required reviewers** and add the people allowed to approve publishes.
3. Optional: restrict **deployment branches** / add **wait timer** per your org policy.
4. Optional: add a **ruleset** so only trusted roles can push **`v*.*.*`** tags.

### One-time npm: Trusted Publishing

Open **Package access** → **Trusted publishing** for [`@stlssdev/uikit`](https://www.npmjs.com/package/@stlssdev/uikit/access), choose **GitHub Actions**, then set:

| Field                | Value                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization or user | **`stlssdev`** (GitHub owner; must match `repository.url` in `package.json`)                                                                                                                                                                         |
| Repository           | **`uikit`**                                                                                                                                                                                                                                          |
| Workflow filename    | **`release.yml`** (exact name under `.github/workflows/`)                                                                                                                                                                                            |
| Environment name     | **`npm`** — must match the **`environment:`** on the **`publish`** job in [`.github/workflows/release.yml`](.github/workflows/release.yml) and the **GitHub Environment** name (so the OIDC token includes the same environment claim npm verifies). |

Click **Set up connection**, complete any **OTP / login** prompts in the browser, then save.

**CI auth:** the workflow **does not** use **`NPM_TOKEN`**. Publishing uses **GitHub Actions OIDC** + the **Trusted Publisher** link above.

`GITHUB_TOKEN` is supplied by Actions; the workflow sets **`contents:write`** and **`id-token:write`** (required for OIDC and **`gh release create`**).

### Manual (local npm) — optional / emergency

1. Merge work to **`main`** (with CI green), with **`package.json`** / **`CHANGELOG.md`** already updated for the version you intend to ship (same as the tag-gated flow).
2. Tag **`vX.Y.Z`** and let **CI** publish (recommended), **or** for an emergency only: **`pnpm release`** (or **`pnpm exec changeset publish --otp …`**) as described in [Publishing & npm troubleshooting](#publishing--npm-troubleshooting).

Changelog entries use **`@changesets/changelog-github`** (PR/commit links when **`changeset version`** runs with normal git remotes / GitHub context).

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

#### OTP for emergency local publish

After versioning (changesets applied), if you must publish **outside** CI (not recommended), use **`pnpm exec changeset publish`** and pass **`--otp`** when npm asks for 2FA:

```bash
pnpm exec changeset publish --otp 123456
```

**`prepublishOnly`** still runs **`pnpm build`** during publish. (`changeset publish --help` documents **`--otp`**.)

For a **TTY prompt**, run **`pnpm exec changeset publish`** in a normal terminal and paste the OTP when the CLI requests it (behavior depends on npm CLI / auth mode).

#### Full automation (CI / no human OTP)

**Default:** pushing tag **`vX.Y.Z`** (after the version PR is on **`main`**) runs [`.github/workflows/release.yml`](.github/workflows/release.yml); a maintainer **approves** the **`npm`** environment deployment; CI publishes with **Trusted Publishing** (OIDC) — **no long-lived publish token** in GitHub. After OIDC publishes succeed, you can tighten npm **Publishing access** to **“Require two-factor authentication and disallow tokens”** if you want token-based publishes disabled ([npm migration tip](https://docs.npmjs.com/trusted-publishers)).

If **`changeset publish`** fails with an OIDC / trusted-publisher error, confirm the **Environment name** on npm matches **`npm`** (same as the workflow’s **`environment:`**).

If you ever add **private npm dependencies**, use a **read-only** granular token only for `pnpm install` in CI (publish still uses OIDC); see [npm docs — private dependencies](https://docs.npmjs.com/trusted-publishers).

- Do not use **`npm publish --ignore-scripts`** unless you mean to: it skips **`prepublishOnly`**, so you can publish without rebuilding (risky if the tarball was built elsewhere).

### `Exit handler never called` from npm

That message is often **npm’s own flaky logging** after another error (e.g. 401). Fix the **401** first; upgrading npm (`npm i -g npm@latest`) can reduce noise.
