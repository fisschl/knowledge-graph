<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import type { EChartsOption } from "echarts";
import { init, type ECharts, type ECElementEvent } from "echarts/core";

const props = defineProps<{
  /** Echarts 图表配置选项 */
  options?: EChartsOption;
  /** 图表渲染器类型，默认为 svg */
  renderer?: "canvas" | "svg";
}>();
const emit = defineEmits<{
  chartClick: [event: ECElementEvent];
}>();

/** 图表容器元素的引用 */
const container = useTemplateRef("figure-element");
/** Echarts 图表实例 */
const chart = shallowRef<ECharts>();

defineExpose({
  container,
  chart,
});

/**
 * 监听图表配置变化并更新图表
 */
watchEffect(() => {
  if (!chart.value || !props.options) return;
  chart.value.setOption(props.options);
});

/**
 * 监听容器尺寸变化并自动调整图表大小
 */
useResizeObserver(container, () => {
  if (!chart.value || chart.value.isDisposed()) return;
  chart.value.resize();
});

/**
 * 初始化图表实例
 */
watch(container, (container) => {
  if (!container) return;

  const instance = init(container, undefined, {
    renderer: props.renderer || "svg",
    locale: "ZH",
  });

  /** 绑定图表点击事件 */
  instance.on("click", (event) => {
    emit("chartClick", event);
  });

  chart.value = instance;
  onWatcherCleanup(() => instance.dispose());
});
</script>

<template>
  <figure ref="figure-element" :class="$style.figure" />
</template>

<style module>
.figure {
  overflow: hidden;
}
</style>
