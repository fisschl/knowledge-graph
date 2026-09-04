<script setup lang="ts">
const router = useRouter();
router.push("/graph");
</script>

<template>
  <div v-loading="true" :class="$style.container" />
</template>

<style module>
.container {
  height: 100vh;
}
</style>
