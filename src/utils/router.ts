import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

const { BASE_URL } = import.meta.env;

export const router = createRouter({
  history: createWebHashHistory(BASE_URL),
  routes,
});
