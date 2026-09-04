<script lang="ts" setup>
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-vue";
import { useDebounceFn, useElementSize } from "@vueuse/core";

const emit = defineEmits<{
  widthChange: [viewportWidth: number, contentWidth: number];
}>();

const scrollOuterRef = useTemplateRef("scrollOuter");
const scrollInnerRef = useTemplateRef("scrollInner");
const { width: viewportWidth } = useElementSize(scrollOuterRef);
const { width: contentWidth } = useElementSize(scrollInnerRef);

const scrollStep = computed(() => viewportWidth.value / 3);

const isOverflowing = computed(
  () => viewportWidth.value > 0 && contentWidth.value > viewportWidth.value,
);

const minLeft = computed(() =>
  isOverflowing.value ? viewportWidth.value - contentWidth.value : 0,
);

const innerLeft = ref(0);

const clampInnerLeft = (left: number) => Math.min(0, Math.max(minLeft.value, left));

const handleWidthChange = useDebounceFn(() => {
  innerLeft.value = clampInnerLeft(innerLeft.value);
  emit("widthChange", viewportWidth.value, contentWidth.value);
}, 120);

watch([viewportWidth, contentWidth], handleWidthChange);

const scrollMiddle = (direction: "left" | "right") => {
  const delta = direction === "left" ? scrollStep.value : -scrollStep.value;
  innerLeft.value = clampInnerLeft(innerLeft.value + delta);
};
</script>

<template>
  <div :class="$style.container">
    <button
      v-if="isOverflowing"
      type="button"
      :class="[$style.button, $style.leftButton]"
      @click="scrollMiddle('left')"
    >
      <IconChevronLeft :size="17" />
    </button>
    <div ref="scrollOuter" :class="$style.scrollOuter">
      <div ref="scrollInner" :class="$style.scrollInner" :style="{ left: `${innerLeft}px` }">
        <slot name="tabs" />
      </div>
    </div>
    <button
      v-if="isOverflowing"
      type="button"
      :class="[$style.button, $style.rightButton]"
      @click="scrollMiddle('right')"
    >
      <IconChevronRight :size="17" />
    </button>
  </div>
</template>

<style module>
.container {
  display: flex;
  align-items: stretch;
  min-width: 0;
  height: var(--tab-header-height, 45px);
  gap: 2px;
}

.scrollOuter {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.scrollInner {
  position: absolute;
  top: 0;
  height: 100%;
  min-width: 100%;
  width: max-content;
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: var(--tab-header-justify-content, flex-start);
  overflow: hidden;
  transition: left 250ms;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 100%;
  padding: 0;
  color: #606266;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 120ms;
  flex-shrink: 0;
}

.button:hover {
  color: #303133;
}
</style>
