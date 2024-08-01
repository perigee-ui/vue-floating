<script setup lang="ts">
import { shallowRef } from 'vue'
import { useClick, useDelayGroup, useDismiss, useFloating, useFocus, useInteractions, useRole, useTransitionStyles } from '@perigee-ui/floating-vue/index.ts'
import { offset } from '@perigee-ui/floating-vue/core/index.ts'

const open = shallowRef(false)

const { refs, floatingStyles, context } = useFloating({
  placement,
  open,
  onOpenChange(v) {
    open.value = v
  },
  middleware: [offset(5), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
})

const delayContext = useDelayGroup(context)

const hover = useHover(context, {
  delay: delayContext.groupDelay === 0 ? delay : delayContext.groupDelay,
  move: false,
})
const focus = useFocus(context)
const role = useRole(context, { role: 'tooltip' })
const dismiss = useDismiss(context)

const { getReferenceProps, getFloatingProps } = useInteractions([
  hover,
  focus,
  role,
  dismiss,
])

const instantDuration = 0
const openDuration = 750
const closeDuration = 250

const { isMounted, styles } = useTransitionStyles(context, {
  duration: {
    open: () => delayContext.isInstantPhase ? instantDuration : openDuration,
    close: () => delayContext.isInstantPhase ? delayContext.currentId === context.floatingId ? closeDuration : instantDuration : closeDuration,
  },
  initial: {
    opacity: 0,
    scale: '0.925',
  },
  common: ({ side }) => ({
    transitionTimingFunction: 'cubic-bezier(.18,.87,.4,.97)',
    transformOrigin: {
      top: 'bottom',
      left: 'right',
      bottom: 'top',
      right: 'left',
    }[side],
  }),
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
      {{ label }}
    </button>

    <div
      v-if="isMounted"
      role="presentation"
      :style="floatingStyles"
    >
      <div
        className="bg-black text-white p-1 px-2 rounded"
        :style="styles"
        v-bind="getFloatingProps()"
      >
        {{ label }}
      </div>
    </div>
  </div>
</template>
