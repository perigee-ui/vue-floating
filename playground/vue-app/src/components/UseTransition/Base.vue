<script setup lang="ts">
import { shallowRef } from 'vue'
import { useClick, useFloating, useInteractions, useTransitionStatus } from '@perigee-ui/floating-vue'
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

const { isMounted, status } = useTransitionStatus(context)
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
      :style="floatingStyles"
      v-bind="getFloatingProps()"
      :data-status="status"
    >
      floating
    </div>
  </div>
</template>

<style scoped>
#floating {
  transition-property: opacity, transform;
}
#floating[data-status="open"],
#floating[data-status="close"] {
  transition-duration: 250ms;
}
#floating[data-status="initial"],
#floating[data-status="close"] {
  opacity: 0;
  transform: scale(0.4);
}
</style>
