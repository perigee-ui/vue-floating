<script setup lang="ts">
import { shallowRef, triggerRef } from 'vue'
import { inner, useClick, useDismiss, useFloating, useInteractions } from '@perigee-ui/floating-vue'
import { type UseFloatingCofnig, autoUpdate } from '@perigee-ui/floating-vue/core'
import { useRef } from '@perigee-ui/floating-vue/vue'

const open = shallowRef(false)
const index = shallowRef(0)
const listRef = useRef<Array<HTMLElement | undefined>>([])
const config = shallowRef<UseFloatingCofnig>({
  placement: 'bottom',
  middleware: [inner({ listRef, index })],
})

const { context, floatingStyles, refs } = useFloating({
  open,
  onOpenChange: v => open.value = v,
  whileElementsMounted: autoUpdate,
}, config)

const list = ['One', 'Two', 'Three']

function onClick(i: number) {
  index.value = i
  triggerRef(config)
}

const { getReferenceProps, getFloatingProps } = useInteractions([
  useClick(context),
  useDismiss(context),
])
</script>

<template>
  <div>
    <button
      :ref="(el) => refs.setReference(el as any)"
      class="reference"
      type="button"
      v-bind="getReferenceProps()"
    >
      Anchor {{ index }}
    </button>

    <ul
      v-if="open"
      :ref="(el:any) => refs.setFloating(el)"
      class="floating"
      :style="floatingStyles"
      v-bind="getFloatingProps()"
    >
      <li
        v-for="(item, i) in list"
        :key="item"

        :ref="(node: any) => {
          if (!node)
            listRef.current.splice(i, 1)
          else
            listRef.current[i] = node;
        }"
        :style="{
          color: i === index ? 'cyan' : 'inherit',
          cursor: 'pointer',
        }"

        @click="() => onClick(i)"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
ul {
  all: unset;
  list-style: none;
  background: rgba(0, 0, 0, 0.5);
  width: 150px;
  color: white;
  z-index: 20;
}

li {
  margin: 0 auto;
  padding: 10px;
}
</style>
