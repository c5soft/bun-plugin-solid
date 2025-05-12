import type { PluginItem } from "@babel/core";
import tsPreset from "@babel/preset-typescript";
import solidPreset, { type BabelPresetSolidOptions } from "babel-preset-solid";

type SolidPluginOptions = {
  /**
   * Whether to generate DOM or SSR-compatible output.
   * Defaults to `dom`.
   */
  readonly generate: BabelPresetSolidOptions["generate"];

  /**
   * Enables hydration code generation for SSR. Defaults to `true`.
   */
  readonly hydratable: BabelPresetSolidOptions["hydratable"];

  /**
   * Controls source map generation:
   * - false (default): no source maps
   * - true: external `.map` file
   * - "inline": embedded base64-encoded map in output
   *
   * Defaults to `"inline"`.
   */
  readonly sourceMaps: boolean | "inline";

  /**
   * Whether to enable debug logging.
   * Defaults to `false`.
   */
  readonly debug?: boolean;
};

const logPrefix = "\x1b[36m[bun-plugin-solid-jsx]\x1b[0m";
const warnPrefix = "\x1b[33m[bun-plugin-solid-jsx]\x1b[0m";

/**
 * A Bun plugin for transforming SolidJS `.tsx`/`.jsx` files at build time using Babel.
 *
 * This plugin uses the `babel-preset-solid` and `@babel/preset-typescript` presets to convert Solid JSX
 * into DOM or SSR-compatible output, depending on the configuration.
 *
 * @remarks
 * - This plugin is **Bun-only** and is designed for use with `bun build` or a Bun preload script.
 * - It does not run in Node.js, Deno, or browser environments.
 * - Consumers must provide their own versions of Babel and the required presets as peer dependencies.
 *
 * @example
 * ```ts
 * // Using Bun.build
 * import { SolidPlugin } from "@dschz/bun-plugin-solid";
 *
 * await Bun.build({
 *   entrypoints: ["./src/index.ts"],
 *   outdir: "./dist",
 *   target: "bun",
 *   format: "esm",
 *   plugins: [
 *     SolidPlugin({
 *       generate: "ssr",
 *       hydratable: true,
 *       sourceMaps: false, // recommended for production
 *     }),
 *   ],
 * });
 * ```
 *
 * * @example
 * ```ts
 * // Using Bun.plugin
 * import { SolidPlugin } from "@dschz/bun-plugin-solid";
 *
 * // You must pass this script to `preload` in your `bunfig.toml`
 * await Bun.plugin(
 *   SolidPlugin({
 *     generate: "ssr",
 *     hydratable: true,
 *     sourceMaps: true,
 *   }),
 * );
 * ```
 *
 * @param options - Configuration for JSX transform behavior, hydration support, source maps, and debug output.
 * @returns A Bun-compatible plugin object that can be passed to `bun build`.
 */
export const SolidPlugin = (options: Partial<SolidPluginOptions> = {}): Bun.BunPlugin => {
  const { generate = "dom", hydratable = true, sourceMaps = "inline", debug = false } = options;

  const debugLog = (msg: string) => {
    if (debug) console.log(`${logPrefix} ${msg}`);
  };

  const debugWarn = (msg: string) => {
    if (debug) console.warn(`${warnPrefix} ${msg}`);
  };

  const plugin = {
    name: "bun-plugin-solid",
    setup: (build) => {
      let babel: typeof import("@babel/core") | undefined;
      let babelTransformPresets: PluginItem[] | undefined;

      build.onLoad({ filter: /\.[tj]sx$/ }, async ({ path }) => {
        // Memoized lazy import of babel
        if (!babel) babel = await import("@babel/core");

        if (!babelTransformPresets) {
          babelTransformPresets = [
            [tsPreset, {}],
            [solidPreset, { generate, hydratable }],
          ];
        }

        debugLog(`Transforming: ${path}`);

        const start = performance.now();

        const result = await babel.transformFileAsync(path, {
          presets: babelTransformPresets,
          filename: path,
          sourceMaps,
        });

        const end = performance.now();

        debugLog(`Transformed: ${path} in ${Math.round(end - start)}ms`);

        if (!result || !result.code) {
          debugWarn(`No code for: ${path}`);
          return;
        }

        return {
          loader: "js",
          contents: result.code,
        };
      });
    },
  } satisfies Bun.BunPlugin;

  return Object.freeze(plugin);
};
