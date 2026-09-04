import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";
import AutoImport from "unplugin-auto-import/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { defineConfig, loadEnv, type PluginOption, type UserConfig } from "vite";
import { VueRouterAutoImports } from "vue-router/unplugin";
import VueRouter from "vue-router/vite";

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    VueRouter({
      exclude: ["**/utils/**", "**/components/**", "**/assets/**"],
    }),
    vue(),
    AutoImport({
      imports: ["vue", VueRouterAutoImports],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      deep: false,
      resolvers: [ElementPlusResolver()],
    }),
  ];

  const { VITE_LEGACY_PLUGIN, VITE_SOURCEMAP } = loadEnv(
    mode,
    fileURLToPath(new URL("./", import.meta.url)),
  );

  if (VITE_LEGACY_PLUGIN === "on") {
    const legacyPlugin = import("@vitejs/plugin-legacy").then((module) => {
      return module.default({
        modernPolyfills: true,
        renderLegacyChunks: false,
        modernTargets: browserslist(),
      });
    });
    plugins.push(legacyPlugin);
  }

  const config: UserConfig = {
    clearScreen: false,
    base: "/knowledge-graph/",
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("src", import.meta.url)),
      },
    },
    css: {
      devSourcemap: VITE_SOURCEMAP === "on",
      transformer: "lightningcss",
      lightningcss: {
        cssModules: {
          pure: true,
        },
        targets: browserslistToTargets(browserslist()),
      },
    },
    build: {
      sourcemap: VITE_SOURCEMAP === "on",
    },
  };

  return config;
});
