<script setup lang="ts">
import { shallowRef } from 'vue'
import { useClick, useFloating, useInteractions, useTransitionStyles } from '@perigee-ui/floating-vue'
import { autoUpdate, offset } from '@perigee-ui/floating-vue/core'

const open = shallowRef(false)

const { context, floatingStyles, refs: { setFloating, setReference } } = useFloating({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
  whileElementsMounted: autoUpdate,
  transform: false,
}, {
  placement: 'top',
  middleware: [offset(20)],
})

const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context)])

const { isMounted, styles } = useTransitionStyles(context, {
  duration: {
    open: 250,
    close: 250,
  },
  initial: {
    opacity: 0,
    transform: 'scale(0.4)',
  },
})
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
      v-if="isMounted"
      id="floating"
      :ref="(el:any) => setFloating(el)"
      class="floating"
      :style="[floatingStyles, styles]"
      v-bind="getFloatingProps()"
    >
      floating
    </div>
  </div>
</template>
