import { defineConfig } from "oxfmt";
import { ignorePatterns } from "./oxlint.config.ts";

export default defineConfig({
  ignorePatterns,
  sortImports: {
    newlinesBetween: false,
  },
});
