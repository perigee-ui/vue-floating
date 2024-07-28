<script setup lang="tsx">
import { useClick, useDismiss, useFloating, useInteractions } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { ref } from 'vue'

const open = ref(false)

const { context, floatingStyles, refs: { setFloating, setReference } } = useFloating({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
}, {
  placement: 'top',
  middleware: [offset(20)],
})

const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context), useDismiss(context)])
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
      class="floating"
      :style="floatingStyles"
      v-bind="getFloatingProps()"
    >
      floating
    </div>
  </div>
</template>
