<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useDismiss, useFloating, useInteractions, useListNavigation } from '@perigee-ui/floating-vue/index.ts'
import { offset } from '@perigee-ui/floating-vue/core/index.ts'

const isOpen = shallowRef(false)
const inputValue = shallowRef('')
const activeIndex = shallowRef<number | undefined>(undefined)

const listRef: (HTMLElement | undefined)[] = []

const { context, refs, floatingStyles } = useFloating<HTMLInputElement>({
  open: isOpen,
  onOpenChange(val) {
    isOpen.value = val
  },
}, {
  placement: 'bottom',
  middleware: [offset(10)],
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
</script>

<template>
  <div>
    <div data-testid="active-index">
      ActiveIndex: {{ activeIndex }}
    </div>
    <input
      class="input w-50"
      data-testid="reference"
      v-bind="getReferenceProps({
        onInput,
        'ref': refs.setReference,
        'value': inputValue,
        'placeholder': 'Enter fruit',
        'aria-autocomplete': 'list',
      })"
    >

    <div
      v-if="isOpen"
      class="listbox"
      role="menu"
      :style="{
        ...floatingStyles,
        width: '200px',
      }"
      v-bind="getFloatingProps({
        ref: refs.setFloating,
      })"
    >
      <ul v-if="items.length > 0">
        <li
          v-for="(item, index) in items"
          :key="item"
          class="text-left flex py-1 px-2 outline-none rounded"
          :class="{
            'bg-blue-500 text-white': activeIndex === index,
          }"
          v-bind="getItemProps({
            ref(node: HTMLLIElement) {
              if (!node) {
                listRef.splice(index, 1)
              }
              else {
                listRef[index] = node;
              }
            },
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
