<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { useClick, useDismiss, useFloating, useInteractions, useListNavigation } from '@perigee-ui/floating-vue'
import { useRef } from '@perigee-ui/floating-vue/vue'

const isOpen = shallowRef(false)
const activeIndex = shallowRef<number | undefined>(undefined)

const listRef = useRef<(HTMLLIElement | undefined)[]>([])

const { refs, context, floatingStyles } = useFloating({
  open: isOpen,
  onOpenChange(val) {
    isOpen.value = val
  },
}, {
  placement: 'bottom',
  middleware: [offset(20)],
})

const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
  useDismiss(context),
  useListNavigation(
    context,
    {
      listRef,
      activeIndex,
      onNavigate(index) {
        activeIndex.value = index
      },
    },
  ),
])

const items = ['one', 'two', 'three']
</script>

<template>
  <div>
    <button
      class="reference"
      type="button"
      v-bind="getReferenceProps({
        ref: refs.setReference,
      })"
    >
      Trigger
    </button>

    <div
      v-if="isOpen"
      class="listbox"
      :style="floatingStyles"
      role="menu"
      v-bind="getFloatingProps({
        ref: refs.setFloating,
      })"
    >
      <ul>
        <li
          v-for="(item, index) in items"
          :key="item"
          :data-testid="`item-${index}`"
          :aria-selected="activeIndex === index"
          tabindex="-1"
          class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
          v-bind="getItemProps({
            ref(node: HTMLLIElement) {
              listRef.current[index] = node;
            },
          })"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>
