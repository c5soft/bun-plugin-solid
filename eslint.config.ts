import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ["**/build/**", "**/coverage/**", "**/dist/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["__tests__/**/*.ts", "__tests__/**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
