<script setup lang="ts">
import { useFloatingDelayGroup } from '@perigee-ui/floating-vue'
import Tooltip from './Tooltip.vue'

useFloatingDelayGroup({
  delay: {
    open: 500,
    close: 200,
  },
  timeoutMs: 200,
})
</script>

<template>
  <div class="flex gap-1">
    <Tooltip label="My tooltip 1" />
    <Tooltip label="My tooltip 2" />
    <Tooltip label="My tooltip 3" />
  </div>
</template>
