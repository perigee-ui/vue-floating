<script setup lang="tsx">
import { useClick, useFloating, useInteractions, useTypeahead } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { ref } from 'vue'

const open = ref(false)

const { context, floatingStyles, refs: { setFloating, setReference } } = useFloating({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
}, {
  placement: 'bottom',
  middleware: [offset(20)],
})

const activeIndex = ref<number>()

const items = ref(['one', 'two', 'three'])

const typeahead = useTypeahead(context, {
  list: items.value,
  activeIndex,
  onMatch(value) {
    activeIndex.value = value
  },
})

const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([useClick(context), typeahead])
</script>

<template>
  <div>
    <button
      :ref="(el:any) => setReference(el)"
      class="reference"
      type="button"
      v-bind="getReferenceProps()"
    >
      Trigger
    </button>

    <div
      v-if="open"
      :ref="(el:any) => setFloating(el)"
      class="flex flex-col rounded bg-white shadow-lg outline-none p-1 border border-slate-900/10 bg-clip-padding w-25"
      role="listbox"
      :style="floatingStyles"
      v-bind="getFloatingProps()"
    >
      <div
        v-for="(item, index) in items"
        :key="item"
        class="text-left flex py-1 px-2 outline-none rounded"
        :class="{
          'bg-blue-500 text-white': index === activeIndex,
          'opacity-40': index === 1,
        }"
        role="option"
        :tabindex="activeIndex === index ? 0 : -1"
        :aria-selected="index === activeIndex"
        v-bind="getItemProps()"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>
