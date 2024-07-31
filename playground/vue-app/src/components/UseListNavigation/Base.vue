<script setup lang="tsx">
import { ref, shallowRef, watchEffect } from 'vue'
import { offset } from '@perigee-ui/floating-vue/core/index.ts'
import { useClick, useDismiss, useFloating, useInteractions, useListNavigation } from '@perigee-ui/floating-vue/index.ts'

const isOpen = shallowRef(false)
const activeIndex = ref<number | null>(null)

const listRef: (HTMLElement | undefined)[] = []

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
      list: listRef,
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
              listRef[index] = node;
            },
          })"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>
