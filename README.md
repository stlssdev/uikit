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
import '@stlssdev/uikit/style.css';
```

## Usage

```tsx
import { Button } from '@stlssdev/uikit';

export function Example() {
  return (
    <Button variant="primary" type="button" onClick={() => console.log('clicked')}>
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

## Publish to npm (v0.0.1)

1. Ensure you are logged in: `npm whoami`
2. For the `@stlssdev` scope, your npm user must belong to the **stlssdev** org (or you must use the correct org name).
3. `package.json` includes `"publishConfig": { "access": "public" }` for a public scoped package.
4. From this directory:

```bash
pnpm build
npm publish
```

`prepublishOnly` runs `pnpm build` automatically before publish.

### Optional `.npmrc`

If your org uses a private registry, configure it in `~/.npmrc` or project `.npmrc` per your team’s policy. For the public npm registry, no extra file is required.

## License

MIT — see [LICENSE](./LICENSE).
