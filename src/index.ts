import type { PluginItem } from "@babel/core";
import tsPreset from "@babel/preset-typescript";
import solidPreset, { type BabelPresetSolidOptions } from "babel-preset-solid";
import type { BunPlugin } from "bun";

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

export const SolidPlugin = (options: Partial<SolidPluginOptions> = {}): BunPlugin => {
  const { generate = "dom", hydratable = true, sourceMaps = "inline", debug = false } = options;

  const debugLog = (msg: string) => {
    if (debug) console.log(`${logPrefix} ${msg}`);
  };

  const debugWarn = (msg: string) => {
    if (debug) console.warn(`${warnPrefix} ${msg}`);
  };

  const plugin = {
    name: "bun-plugin-solid-jsx",
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
  } satisfies BunPlugin;

  return Object.freeze(plugin);
};
