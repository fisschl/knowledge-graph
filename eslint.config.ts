import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import oxlint from "eslint-plugin-oxlint";
import pluginVue from "eslint-plugin-vue";
import { globalIgnores } from "eslint/config";
import oxlintConfig, { ignorePatterns } from "./oxlint.config.ts";

export default defineConfigWithVueTs(
  ...pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  ...oxlint.buildFromOxlintConfig(oxlintConfig),
  globalIgnores(ignorePatterns),
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "vue/require-default-prop": "off",
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/component-name-in-template-casing": [
        "error",
        "PascalCase",
        { registeredComponentsOnly: false },
      ],
      "vue/define-props-declaration": ["error", "type-based"],
      "vue/define-emits-declaration": ["error", "type-based"],
      "vue/enforce-style-attribute": ["error", { allow: ["module"] }],
      "vue/html-button-has-type": "error",
      "vue/no-import-compiler-macros": "error",
      "vue/no-static-inline-styles": "error",
      "vue/no-multiple-objects-in-class": "error",
      "vue/padding-line-between-blocks": "error",
      "vue/prefer-use-template-ref": "error",
      "vue/require-macro-variable-name": "error",
      "vue/require-typed-ref": "error",
    },
  },
);
