import type {
  BunPlugin,
  OnLoadCallback,
  OnLoadResultSourceCode,
  PluginBuilder,
  PluginConstraints,
} from "bun";
import { unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { describe, expect, test, vi } from "vitest";

import { SolidPlugin } from "../index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extractOnLoadHandler = async (plugin: BunPlugin) => {
  let constraints: PluginConstraints | undefined;
  let callback: OnLoadCallback | undefined;

  const builder = {
    config: { plugins: [], entrypoints: [] },
    onStart() {
      return this;
    },
    onBeforeParse() {
      return this;
    },
    onResolve() {
      return this;
    },
    module() {
      return this;
    },
    onLoad(_constraints, _callback) {
      constraints = _constraints;
      callback = _callback;
      return this;
    },
  } satisfies PluginBuilder;

  await plugin.setup(builder);

  return { constraints, callback };
};

describe("BUN PLUGIN: Solid", () => {
  test("matches only jsx/tsx file types", async () => {
    const plugin = SolidPlugin();
    const { constraints } = await extractOnLoadHandler(plugin);

    expect(constraints).toBeDefined();

    const { filter } = constraints as PluginConstraints;

    const nonMatchingFiles = ["file.ts", "file.js", "file.json", "file.css", "file.md", "file.bak"];

    for (const file of nonMatchingFiles) {
      expect(filter.test(file)).toBe(false);
    }

    const matchingFiles = ["file.tsx", "file.jsx"];

    for (const file of matchingFiles) {
      expect(filter.test(file)).toBe(true);
    }
  });

  test("transforms Solid JSX/TSX for DOM", async () => {
    const plugin = SolidPlugin({
      generate: "dom",
      hydratable: true,
      sourceMaps: false,
      debug: false,
    });

    const { callback } = await extractOnLoadHandler(plugin);

    expect(callback).toBeDefined();

    const filePath = join(__dirname, "Sample.tsx");

    writeFileSync(filePath, `const App = () => <div>Hello Solid</div>;`);

    const transform = callback as OnLoadCallback;

    const result = (await transform({
      path: filePath,
      loader: "tsx",
      namespace: "",
      defer: () => Promise.resolve(),
    })) as OnLoadResultSourceCode;

    unlinkSync(filePath);

    expect(result).toBeDefined();
    expect(result.loader).toBe("js");
    expect(result.contents).toMatchSnapshot();
  });

  test("transforms Solid JSX/TSX for SSR", async () => {
    const plugin = SolidPlugin({
      generate: "ssr",
      hydratable: false,
      sourceMaps: false,
    });

    const { callback } = await extractOnLoadHandler(plugin);

    const filePath = join(__dirname, "SampleSSR.tsx");

    writeFileSync(filePath, `const App = () => <div>Server Rendered</div>;`);

    const transform = callback as OnLoadCallback;

    const result = (await transform({
      path: filePath,
      loader: "tsx",
      namespace: "",
      defer: () => Promise.resolve(),
    })) as OnLoadResultSourceCode;

    unlinkSync(filePath);

    expect(result).toBeDefined();
    expect(result.loader).toBe("js");
    expect(result.contents).toMatchSnapshot();
  });

  test("handles empty JSX/TSX files", async () => {
    const plugin = SolidPlugin({
      generate: "dom",
      hydratable: true,
      sourceMaps: false,
      debug: false,
    });

    const { callback } = await extractOnLoadHandler(plugin);

    const filePath = join(__dirname, "Empty.tsx");

    writeFileSync(filePath, "");

    const transform = callback as OnLoadCallback;

    const result = await transform({
      path: filePath,
      loader: "tsx",
      namespace: "",
      defer: () => Promise.resolve(),
    });

    unlinkSync(filePath);

    expect(result).toBeUndefined();
  });

  test("logs debug messages when debug is enabled", async () => {
    const plugin = SolidPlugin({ sourceMaps: false, debug: true });

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { callback } = await extractOnLoadHandler(plugin);
    const transform = callback as OnLoadCallback;

    const filePath = join(__dirname, "Debug.tsx");
    writeFileSync(filePath, `const App = () => <div>Debug</div>;`);

    await transform({
      path: filePath,
      loader: "tsx",
      namespace: "",
      defer: () => Promise.resolve(),
    });

    unlinkSync(filePath);

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("[bun-plugin-solid-jsx]"));

    const filePath2 = join(__dirname, "Empty.tsx");
    writeFileSync(filePath2, "");

    await transform({
      path: filePath2,
      loader: "tsx",
      namespace: "",
      defer: () => Promise.resolve(),
    });

    unlinkSync(filePath2);

    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining("[bun-plugin-solid-jsx]"));

    consoleLog.mockRestore();
    consoleWarn.mockRestore();
  });
});
