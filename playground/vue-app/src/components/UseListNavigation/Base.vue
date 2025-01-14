<script setup lang="ts">
import { useDismiss, useFloating, useInteractions, useListNavigation } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { useRef } from '@perigee-ui/floating-vue/vue'
import { EMPTY_OBJ } from '@vue/shared'
import { getCurrentInstance, shallowRef } from 'vue'

const isOpen = shallowRef(false)
const activeIndex = shallowRef<number | undefined>(undefined)

const listRef = useRef<(HTMLLIElement | undefined)[]>([])

const { refs, context, floatingStyles } = useFloating({
  open: isOpen,
  onOpenChange(val) {
    isOpen.value = val
  },
  config: {
    placement: 'bottom',
    middleware: [offset(20)],
  },
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

const i = getCurrentInstance()!

const iRefs = i.refs === EMPTY_OBJ ? (i.refs = {}) : i.refs
Object.defineProperty(iRefs, 'list', {
  enumerable: true,
  get: () => {
    return listRef.current
  },
  set: (val) => {
    listRef.current = val
  },
})
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
          ref="list"
          :data-testid="`item-${index}`"
          :aria-selected="activeIndex === index"
          tabindex="-1"
          class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
          v-bind="getItemProps()"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>
