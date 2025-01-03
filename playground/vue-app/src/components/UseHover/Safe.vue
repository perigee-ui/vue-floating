<script setup lang="ts">
import { safePolygon, useFloating, useHover, useInteractions } from '@perigee-ui/floating-vue'
import { offset } from '@perigee-ui/floating-vue/core'
import { shallowRef } from 'vue'

const open = shallowRef(false)

const { context, floatingStyles, refs: { setFloating, setReference } } = useFloating({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
  config: {
    placement: 'top',
    middleware: [offset(20)],
  },
})

const { getReferenceProps, getFloatingProps } = useInteractions([useHover(context, {
  handleClose: safePolygon({ blockPointerEvents: true }),
})])
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
