<script lang="ts" setup>
import { useDebounceFn, watchImmediate } from "@vueuse/core";
import type { CSSProperties } from "vue";
import type { SegmentedOption } from "./segmented";

const props = defineProps<{
  options: SegmentedOption[];
}>();

const modelValue = defineModel<string>();

/**
 * 处理选项点击
 *
 * 更新当前选中的值，并触发背景动画。
 */
const handleClick = (option: SegmentedOption) => {
  modelValue.value = option.value;
};

const background = ref<CSSProperties>();
const container = useTemplateRef("container-element");

/**
 * 更新背景位置和大小
 *
 * 根据当前选中的按钮位置计算背景元素的样式。
 */
const updateBackground = useDebounceFn(() => {
  if (!container.value) return;
  const ele = container.value.querySelector('button[data-selected="true"]');
  if (!ele) return;
  const { width, left, height } = ele.getBoundingClientRect();
  const { left: containerLeft } = container.value.getBoundingClientRect();
  background.value = {
    width: `${width}px`,
    left: `${left - containerLeft}px`,
    height: `${height}px`,
  };
}, 120);

watchImmediate(modelValue, updateBackground);
watchImmediate(toRef(props, "options"), updateBackground);
</script>

<template>
  <div ref="container-element" :class="$style.container">
    <i v-if="background" :class="$style.background" :style="background" />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="$style.button"
      :data-selected="modelValue === option.value"
      @click="handleClick(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style module>
.container {
  height: 32px;
  padding: 2px;
  display: flex;
  width: fit-content;
  border-radius: 6px;
  background: #f4f6f8;
  position: relative;
}

.background {
  position: absolute;
  background: #ffffff;
  border-radius: 4px;
  box-shadow:
    0px 1px 2px 0px rgba(0, 0, 0, 0.04),
    0px 1px 6px -1px rgba(0, 0, 0, 0.03),
    0px 2px 4px 0px rgba(0, 0, 0, 0.03);
  transition-duration: 200ms;
  transition-property: width, left;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 14px;
  font-weight: normal;
  align-self: stretch;
  z-index: 1;
  padding: 2px 12px;
  transition-duration: 200ms;
  transition-property: color;
}

.button[data-selected="true"] {
  color: #222222;
}

.button:hover {
  color: #222222;
}
</style>
