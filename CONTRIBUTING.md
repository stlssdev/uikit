# Contributing

## Tooling

| Script                     | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `pnpm check`               | Format (check), oxlint, TypeScript                          |
| `pnpm validate`            | `check` + library build + Storybook build (matches CI)      |
| `pnpm build`               | Library + `dist/style.css`                                  |
| `pnpm build-storybook`     | Static Storybook                                            |
| `pnpm changeset`           | Add a changeset (release notes / semver intent)             |
| `pnpm version-packages`    | Apply changesets → bump `package.json` + `CHANGELOG.md`     |
| `pnpm release`             | Build then `changeset publish` (npm release)                |
| `pnpm pub:dry`             | `build` + `npm pack --dry-run` (inspect tarball, no upload) |
| `pnpm check:format:staged` | `oxfmt --check` on **staged** files only (lint-staged)      |
| `pnpm check:lint:staged`   | `oxlint` on **staged** files only (check-only, no writes)   |

## Git hooks (Husky)

On `pnpm install`, Husky installs hooks from `.husky/`.

- **pre-commit** (`.husky/pre-commit`): three logged steps — staged **format check** → whole-repo **TypeScript** → staged **lint check**. Nothing auto-writes; fix locally and re-stage.
- **commit-msg** (`.husky/commit-msg`): **Commitlint** (Conventional Commits), separate hook after tree checks.

Configs: [`.lintstagedrc.format.json`](.lintstagedrc.format.json), [`.lintstagedrc.lint.json`](.lintstagedrc.lint.json).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example:

- `feat(button): add loading state`
- `fix: correct focus ring contrast`
- `chore: bump devDependencies`
- `docs: update README install`

## Releases and changelog

1. Merge work to the default branch (`main`).
2. Run `pnpm changeset`, pick semver level, describe the user-facing change.
3. Merge the changeset markdown PR (or commit it on `main`).
4. Run `pnpm version-packages` — updates version(s) and **CHANGELOG.md** from changesets.
5. Run `pnpm release` — builds and runs `changeset publish` to npm.

Changelog entries use `@changesets/changelog-github` (links to PRs/commits when run in GitHub context).

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
2. **Org access** — that user must be on the **`stlssdev`** org with permission to publish packages ([Members](https://www.npmjs.com/org/stlssdev/members)). If the org shows **0 packages** but publish still fails with **401**, it is almost always **auth / membership**, not the tarball.
3. **Dry run (local)** — `pnpm pub:dry` runs `build` then `npm pack --dry-run` so you can confirm the tarball contents without hitting the registry.

### If you see `401` on `PUT …/@stlssdev%2fuikit`

- **Confirm org access** (CLI): `npm org ls <org>` — e.g. `npm org ls stlssdev` should list your user as **`owner`** if you control the scope.
- **2FA (`auth-and-writes`)** — if your npm profile uses **two-factor auth** for writes, **`changeset publish` / `npm publish` must include a one-time password**. Example after a fresh build:

  ```bash
  pnpm build
  pnpm exec changeset publish --otp 123456
  ```

  Replace `123456` with the current code from your authenticator app. (`changeset publish --help` documents `--otp`.)

- Log in again if needed: **`npm login`**, or use a **granular access token** with **Publish** for `@stlssdev/uikit` / the org in `~/.npmrc` as `//registry.npmjs.org/:_authToken=…` (automation tokens can avoid per-publish OTP in CI when configured correctly).
- Do not use **`npm publish --ignore-scripts`** unless you mean to: it skips **`prepublishOnly`**, so you can publish without rebuilding (risky if the tarball was built elsewhere).

### `Exit handler never called` from npm

That message is often **npm’s own flaky logging** after another error (e.g. 401). Fix the **401** first; upgrading npm (`npm i -g npm@latest`) can reduce noise.
