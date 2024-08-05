<script setup lang="ts">
import { shallowRef } from 'vue'
import { useClick, useFloating, useFloatingList, useInteractions, useListNavigation, useTypeahead } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { useRef } from '@perigee-ui/floating-vue/vue'
import { provideSelectContext } from './Select.ts'

const isOpen = shallowRef(false)
const activeIndex = shallowRef<number>()

const { refs, context, floatingStyles } = useFloating({
  open: isOpen,
  onOpenChange(v) {
    isOpen.value = v
  },
}, {
  placement: 'bottom',
  middleware: [offset(20)],
})

const elementsRef = useRef<Array<HTMLElement | undefined>>([])
const labelsRef = useRef<Array<string | undefined>>([])

const click = useClick(context)
const listNavigation = useListNavigation(context, {
  listRef: elementsRef,
  activeIndex,
  onNavigate(index) {
    activeIndex.value = index
  },
})
const typeahead = useTypeahead(context, {
  listRef: labelsRef,
  activeIndex,
  onMatch(index) {
    activeIndex.value = index
  },
})

const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
  click,
  listNavigation,
  typeahead,
])

useFloatingList({ elementsRef, labelsRef })

provideSelectContext({ getItemProps, activeIndex })
</script>

<template>
  <div>
    <button
      :ref="(el:any) => refs.setReference(el)"
      class="reference"
      type="button"
      v-bind="getReferenceProps()"
    >
      Open select menu
    </button>

    <div
      v-if="isOpen" :ref="(el:any) => refs.setFloating(el)"
      class="listbox w-40"
      :style="floatingStyles"
      v-bind="getFloatingProps()"
    >
      <slot />
    </div>
  </div>
</template>
