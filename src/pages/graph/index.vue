<script setup lang="ts">
import { BitmapFont } from "pixi.js";
import { Application } from "pixi.js";
import { forceLayout, initialSowing } from "./utils/layout";
import { ForceGraphWorld } from "./utils/world";

const hostElement = useTemplateRef<HTMLDivElement>("graph-host");
const app = shallowRef<Application | null>(null);
const world = shallowRef<ForceGraphWorld | null>(null);

const destroy = () => {
  world.value?.destroy({ children: true });
  app.value?.destroy();
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

  await document.fonts.load('24px "Noto Sans SC"', chars);
  // 烤白 + 超采样：字形以 24px 烘焙成白色图集，
  // 渲染时由各 TextStyle 的 fill 作为 tint 上色，同一图集可渲染任意颜色
  // HMR 重新挂载会重复执行 install:先 uninstall 销毁旧字体(Cache.remove+释放纹理),
  // 避免 "[Cache] already has key" 警告与每次热更泄漏一份字形图集
  BitmapFont.uninstall("Noto Sans SC");
  BitmapFont.install({
    name: "Noto Sans SC",
    style: {
      fontFamily: "Noto Sans SC",
      fontSize: 24,
      fill: "#ffffff",
    },
    chars,
    resolution: devicePixelRatio,
  });
  destroy();

  const instance = markRaw(new Application());
  app.value = instance;
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
  instance.stage.label = "root";
  // 关闭 Pixi 事件系统:交互全部走 DOM canvas 监听(world.ts),消除每 move 的全场景 hit-test 开销
  const { features } = instance.renderer.events;
  features.click = false;
  features.move = false;
  features.globalMove = false;
  features.wheel = false;

  initialSowing(data.nodes);
  await forceLayout({
    nodes: data.nodes,
    edges: data.edges,
  });

  const graphWorld = new ForceGraphWorld(
    reactive({
      nodes: data.nodes,
      edges: data.edges,
      application: instance,
    }),
  );
  world.value = graphWorld;
  instance.stage.addChild(graphWorld);
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
