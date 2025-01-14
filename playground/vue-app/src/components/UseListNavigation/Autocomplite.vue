<script setup lang="ts">
import { useDismiss, useFloating, useInteractions, useListNavigation } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { useRef } from '@perigee-ui/floating-vue/vue'
import { EMPTY_OBJ } from '@vue/shared'
import { computed, getCurrentInstance, shallowRef } from 'vue'

const isOpen = shallowRef(false)
const inputValue = shallowRef('')
const activeIndex = shallowRef<number | undefined>(undefined)

const listRef = useRef<(HTMLElement | undefined)[]>([])

const { context, refs, floatingStyles } = useFloating<HTMLInputElement>({
  open: isOpen,
  onOpenChange(val) {
    isOpen.value = val
  },
  config: {
    placement: 'bottom',
    middleware: [offset(10)],
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
      virtual: true,
      loop: true,
    },
  ),
])

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  inputValue.value = value

  if (value) {
    activeIndex.value = undefined
    isOpen.value = true
  }
  else {
    isOpen.value = false
  }
}

function onItemClick(item: string) {
  inputValue.value = item
  isOpen.value = false
  refs.domReference.current?.focus()
}

const allItems = ['a', 'ab', 'abc', 'abcd']

const items = computed(() => {
  return allItems.filter(item => item.includes(inputValue.value))
})

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
    <div data-testid="active-index">
      ActiveIndex: {{ activeIndex }}
    </div>
    <input
      :ref="refs.setReference as any"
      class="input w-50"
      data-testid="reference"
      v-bind="getReferenceProps({
        onInput,
        'value': inputValue,
        'placeholder': 'Enter fruit',
        'aria-autocomplete': 'list',
      })"
    >

    <div
      v-if="isOpen"
      :ref="refs.setFloating as any"
      class="listbox"
      role="menu"
      :style="{
        ...floatingStyles,
        width: '200px',
      }"
      v-bind="getFloatingProps()"
    >
      <ul v-if="items.length > 0">
        <li
          v-for="(item, index) in items"
          :key="item"
          ref="list"
          class="text-left flex py-1 px-2 outline-none rounded"
          :class="{
            'bg-blue-500 text-white': activeIndex === index,
          }"
          v-bind="getItemProps({
            onClick() {
              onItemClick(item)
            },
          })"
        >
          {{ item }}
        </li>
      </ul>

      <div v-else class="text-left py-1 px-2">
        No items found
      </div>
    </div>
  </div>
</template>
