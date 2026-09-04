<script setup lang="ts">
import { BitmapFont, extensions, CullerPlugin, TextStyle } from "pixi.js";
import { ForceGraph } from "./utils/world";

extensions.add(CullerPlugin);

const hostElement = useTemplateRef<HTMLDivElement>("graph-host");
const world = shallowRef<ForceGraph | null>(null);

const destroy = () => {
  world.value?.destroy();
  const canvas = hostElement.value?.querySelector("canvas");
  if (canvas) hostElement.value?.removeChild(canvas);
};

const initWorld = async () => {
  const response = await fetch("https://bronya.world/datasets/medical_graph_3k.json");
  const data = await response.json();
  if (!hostElement.value) return;
  const { nodes } = data;
  if (!Array.isArray(nodes)) return;
  const chars = nodes.map((data) => data.label).join();

  await document.fonts.load('16px "Noto Sans SC"', chars);
  BitmapFont.install({
    name: "Noto Sans SC",
    style: new TextStyle({
      fontFamily: "Noto Sans SC",
      fontSize: 20,
      fill: "#303133",
    }),
    chars,
    resolution: devicePixelRatio,
  });
  destroy();

  const instance = new ForceGraph();
  world.value = instance;
  await instance.init({
    background: "#ffffff",
    antialias: false,
    resolution: devicePixelRatio,
    autoDensity: true,
    resizeTo: hostElement.value,
    roundPixels: true,
    preference: "webgpu",
  });
  hostElement.value.appendChild(instance.canvas);
  await instance.setData(data);
};

onMounted(async () => {
  await initWorld();
});
onBeforeUnmount(() => destroy());
</script>

<template>
  <div ref="graph-host" :class="$style.host" />
</template>

<style module>
.host {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #ffffff;
}

.host > canvas {
  display: block;
}
</style>
