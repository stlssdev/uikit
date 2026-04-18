# @stlssdev/uikit

React UI components from **stlssdev**. This package is at **v0.0.1** with a minimal surface: a single `Button` and Storybook for development.

## Requirements

- **React** 18+ and **React DOM** 18+ (peer dependencies).

## Install

```bash
npm install @stlssdev/uikit
```

```bash
pnpm add @stlssdev/uikit
```

## Styles

Component CSS is bundled from a single manifest, [`src/styles.css`](src/styles.css), into **`dist/style.css`** at build time (via esbuild). When you add a component with its own `.css` file, add an `@import` for it there so consumers keep one import: `@stlssdev/uikit/style.css`.

Import the stylesheet once in your app (e.g. your root layout or entry file):

```ts
import "@stlssdev/uikit/style.css";
```

## Usage

```tsx
import { Button } from "@stlssdev/uikit";

export function Example() {
  return (
    <Button variant="primary" type="button" onClick={() => console.log("clicked")}>
      Save
    </Button>
  );
}
```

### Props

- **`variant`**: `'primary' | 'secondary' | 'ghost'` (default: `'primary'`)
- **`type`**: standard HTML button `type`
- **`className`**, **`disabled`**, and other native **`<button>`** attributes are supported.
- **`ref`**: forwarded to the underlying `<button>`.

## Development

```bash
pnpm install
pnpm storybook
```

```bash
pnpm validate   # same checks as CI: format, lint, types, build, Storybook static
pnpm build        # dist/ + dist/style.css
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for **Husky**, **Conventional Commits**, **Changesets**, and release workflow.

## Publish to npm

Releases are **tag-gated** and published from **GitHub Actions** (Trusted Publishing / OIDC — no **`NPM_TOKEN`** in GitHub). Maintainer flow:

1. On a branch from **`main`**, run **`pnpm prepare-release`** (draft changeset from git + **`changeset version`**), adjust **`.changeset/*.md`** if needed (or run **`node scripts/changeset-from-git.mjs`** then **`pnpm exec changeset version`**), then PR and merge **`package.json`** / **`CHANGELOG.md`** to **`main`**.
2. Push a semver tag **`vX.Y.Z`** that matches **`package.json`**, approve the **`npm`** environment deployment, and CI runs **`changeset publish`** plus a **GitHub Release**.

See [CONTRIBUTING.md — Releases and changelog](./CONTRIBUTING.md#releases-and-changelog) for the full checklist (environment setup, reruns, troubleshooting).

**Emergency local publish** (not recommended vs CI):

```bash
pnpm release
```

**`pnpm release`** runs **`changeset publish`**; **`prepublishOnly`** runs **`pnpm build`** before pack. With npm **2FA**, use **`pnpm exec changeset publish --otp …`** — see [Publishing & npm troubleshooting](./CONTRIBUTING.md#publishing--npm-troubleshooting).

The **`prepare`** script uses **`husky || exit 0`** so installing this package as a dependency does not fail when the **`husky`** binary is not present (it only runs fully in this repo after **`pnpm install`**).

### Optional `.npmrc`

If your org uses a private registry, configure it in `~/.npmrc` or project `.npmrc` per your team’s policy. For the public npm registry, no extra file is required.

### Publish failed with `401`?

Usually **not** “wrong org”: confirm with **`npm org ls stlssdev`** (owners are listed). If you use npm **2FA** (`auth-and-writes`), you must pass **`--otp`** to publish (see **CONTRIBUTING**). Quick link: [Publishing & npm troubleshooting](CONTRIBUTING.md#publishing--npm-troubleshooting).

## License

MIT — see [LICENSE](./LICENSE).
