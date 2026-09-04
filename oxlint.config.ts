import { defineConfig } from "oxlint";

export const ignorePatterns = [
  ".agents/**/*.md",
  "docs/**/*.md",
  "dist/**",
  "auto-imports.d.ts",
  "components.d.ts",
  "typed-router.d.ts",
  "**/*.js",
  "**/*.mjs",
];

export default defineConfig({
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "vue", "vitest", "promise", "node"],
  ignorePatterns,
  env: {
    browser: true,
    node: true,
  },
  rules: {
    "max-lines": ["error", { max: 1000 }],
    "promise/no-callback-in-promise": "off",
  },
});
