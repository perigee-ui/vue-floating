<script setup lang="ts">
import {
  arrow,
  autoUpdate,
  useFloating,
} from '@perigee-ui/floating-vue/core'
import { computed, shallowRef } from 'vue'

const OPPOSITE_SIDE_BY_SIDE = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
} as { [key: string]: string }

const targetRef = shallowRef<HTMLElement>()
const floatingRef = shallowRef<HTMLElement>()
const floatingArrowRef = shallowRef<HTMLElement>()

const { placement, middlewareData, floatingStyles } = useFloating(
  targetRef,
  floatingRef,
  {
    strategy: 'fixed',
    placement: 'top',
    middleware: [arrow({ element: floatingArrowRef })],
  },
  {
    whileElementsMounted: autoUpdate,
  },
)

const side = computed(() => placement.value.split('-')[0])
</script>

<template>
  <div>
    <!-- target can be slot -->
    <div ref="targetRef" class="target" />

    <div
      ref="floatingRef"
      class="floating"
      :style="floatingStyles"
    >
      <div
        ref="floatingArrowRef"
        class="floatingArrow"
        :style="{
          left: middlewareData.arrow ? `${middlewareData.arrow.x}px` : '',
          top: middlewareData.arrow ? `${middlewareData.arrow.y}px` : '',
          [OPPOSITE_SIDE_BY_SIDE[side]]: `${-(floatingArrowRef?.offsetWidth || 0)}px`,
        }"
      >
        <div class="arrow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.target {
  width: 150px;
  height: 150px;
  position: relative;
  border: 2px dotted black;
  margin: 150px auto;
}

.floating {
  color: white;
  position: absolute;
  width: 100px;
  height: 100px;
  background: black;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
  z-index: 1;
}

.arrow {
  position: absolute;
  width: 20px;
  height: 20px;
  background: red;
  z-index: -1;
  pointer-events: none;
}

.floatingArrow {
  position: absolute;
  width: 16px;
  height: 16px;
}
</style>
