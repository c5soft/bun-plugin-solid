<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Ecosystem&background=tiles&project=bun-plugin-solid" alt="bun-plugin-solid">
</p>

# @dschz/bun-plugin-solid

MIT Licensed

> 🧩 A Bun plugin for transforming SolidJS JSX/TSX files at runtime or build time using Babel. Supports SSR and DOM output.

> ⚠️ **Note**: This plugin is designed specifically for use with the [Bun runtime](https://bun.sh). It will not work in Node.js, Deno, or other JavaScript environments.

## Features

- ✅ Works in both `bun run` (runtime) and `bun build` (build-time) contexts
- 🎯 Supports SSR (`generate: "ssr"`) and DOM (`generate: "dom"`) output
- 💧 Hydratable output toggle for SSR
- 🧱 Designed to be invoked via `preload` or build plugins
- 🪄 Minimal and explicit configuration surface

## Installation

```bash
npm add -d @dschz/bun-plugin-solid @babel/core @babel/preset-typescript babel-preset-solid
pnpm add -d @dschz/bun-plugin-solid @babel/core @babel/preset-typescript babel-preset-solid
yarn add -d @dschz/bun-plugin-solid @babel/core @babel/preset-typescript babel-preset-solid
bun add -d @dschz/bun-plugin-solid @babel/core @babel/preset-typescript babel-preset-solid
```

> These are **peer dependencies**, so they must be installed manually:
>
> - `@babel/core`
> - `@babel/preset-typescript`
> - `babel-preset-solid`

## Plugin Options

> Plugin options `generate` and `hydratable` are directly derived from [`babel-preset-solid`](https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid/src/index.ts#L11-L18) and will be passed to it under the hood.

```ts
type SolidPluginOptions = {
  /**
   * Whether to generate DOM or SSR-compatible output.
   * Defaults to "dom".
   */
  generate?: "dom" | "ssr";

  /**
   * Enables hydration code generation for SSR.
   * Defaults to true.
   */
  hydratable?: boolean;

  /**
   * Controls source map generation:
   * - false: no source maps
   * - true: external .map file
   * - "inline": base64-encoded inline source maps
   *
   * Defaults to "inline".
   */
  sourceMaps?: boolean | "inline";

  /**
   * Enable verbose debug logs during transform.
   * Defaults to false.
   */
  debug?: boolean;
};
```

## Usage

### 🔧 Runtime (Development) via Preload Script

Use this for runtime-based workflows like server-side rendering (SSR) with Elysia, Bun, or other Bun-native frameworks.

#### `bunPreload.ts`:

```ts
import { plugin } from "bun";
import { SolidPlugin } from "@dschz/bun-plugin-solid";

// The `plugin` API automatically registers a BunPlugin
await plugin(
  SolidPlugin({
    generate: "ssr",
    hydratable: true,
    debug: true,
  }),
);
```

#### `bunfig.toml`:

```toml
jsx = "solid"
jsxFactory = "solid-js"
preload = ["./bunPreload.ts"]
```

#### Run:

```bash
bun run server.ts
```

---

### 📦 Build-Time Compilation with `Bun.build()`

Use this in production workflows to pre-compile `.tsx` or `.jsx` files to JavaScript.

#### `build.ts`:

```ts
import { SolidPlugin } from "@dschz/bun-plugin-solid";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  plugins: [
    SolidPlugin({
      generate: "ssr",
      hydratable: true,
      sourceMaps: false, // recommended for production
    }),
  ],
});
```
