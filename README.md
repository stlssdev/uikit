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
pnpm check    # format (check) + oxlint + TypeScript
pnpm build    # dist/ + dist/style.css
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for **Husky**, **Conventional Commits**, **Changesets**, and release workflow.

## Publish to npm

1. Log in: `npm whoami` and ensure access to the `@stlssdev` scope.
2. Record changes with **Changesets** (`pnpm changeset`), then `pnpm version-packages` to bump the version and update **CHANGELOG.md**.
3. From this directory:

```bash
pnpm release
```

`pnpm release` runs `pnpm build` then `changeset publish`. The `prepare` script uses **`husky || exit 0`** so installing this package as a dependency does not fail when the `husky` binary is not present (it only runs fully in this repo after `pnpm install`).

### Optional `.npmrc`

If your org uses a private registry, configure it in `~/.npmrc` or project `.npmrc` per your team’s policy. For the public npm registry, no extra file is required.

## License

MIT — see [LICENSE](./LICENSE).
