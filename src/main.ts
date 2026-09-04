import "@fontsource/noto-sans-sc/chinese-simplified.css";
import "@fontsource/noto-sans-sc/latin.css";
import "@fontsource/noto-sans-sc/latin-ext.css";
import "@fontsource/noto-sans-sc/cyrillic.css";
import { createApp } from "vue";
import { handleHotUpdate } from "vue-router/auto-routes";
import App from "./App.vue";
import { router } from "./utils/router";

if (import.meta.hot) handleHotUpdate(router);

router.beforeEach((to) => {
  const { appTitle } = to.meta;
  if (!appTitle || typeof appTitle !== "string") return;
  document.title = appTitle;
});

createApp(App).use(router).mount("#app");
