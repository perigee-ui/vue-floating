<script setup lang="ts">
import { shallowRef } from 'vue'
import { FloatingFocusManager, useClick, useFloating, useInteractions } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'

const open = shallowRef(false)

const { context, floatingStyles, refs: { setFloating, setReference } } = useFloating({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
}, {
  placement: 'bottom',
  middleware: [offset(20)],
})

const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context)])
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

    <FloatingFocusManager v-if="open" :get-context="() => context">
      <div

        :ref="(el:any) => setFloating(el)"
        class="listbox"
        :style="floatingStyles"
        v-bind="getFloatingProps()"
      >
        <button
          class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
          type="button"
          data-testid="one"
        >
          close
        </button>
        <button
          class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
          type="button"
          data-testid="two"
        >
          confirm
        </button>
        <button
          class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
          type="button"
          data-testid="three"
          @click="() => open = false"
        >
          x
        </button>
      </div>
    </FloatingFocusManager>
  </div>
</template>
