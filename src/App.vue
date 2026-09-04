<script setup lang="ts">
import "dayjs/locale/zh-cn";
import dayjs from "dayjs";
import type { Language } from "element-plus/es/locale";
import elLocaleZhCn from "element-plus/es/locale/lang/zh-cn";

dayjs.locale("zh-cn");

const elLocale = ref<Language>(elLocaleZhCn);
</script>

<template>
  <ElConfigProvider :locale="elLocale">
    <RouterView />
  </ElConfigProvider>
</template>
