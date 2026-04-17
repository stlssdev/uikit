# Contributing

## Tooling

| Script                     | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `pnpm check`               | Format (check), oxlint, TypeScript                        |
| `pnpm validate`            | `check` + library build + Storybook build (matches CI)    |
| `pnpm build`               | Library + `dist/style.css`                                |
| `pnpm build-storybook`     | Static Storybook                                          |
| `pnpm changeset`           | Add a changeset (release notes / semver intent)           |
| `pnpm version-packages`    | Apply changesets → bump `package.json` + `CHANGELOG.md`   |
| `pnpm release`             | Build then `changeset publish` (npm release)              |
| `pnpm check:format:staged` | `oxfmt --check` on **staged** files only (lint-staged)    |
| `pnpm check:lint:staged`   | `oxlint` on **staged** files only (check-only, no writes) |

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
