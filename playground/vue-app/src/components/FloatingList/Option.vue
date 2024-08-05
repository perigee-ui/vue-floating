<script setup lang="ts">
import { useListItem } from '@perigee-ui/floating-vue'
import { useSelectContext } from './Select.ts'

const props = defineProps<{
  label?: string
}>()

const ctx = useSelectContext()

const { setItem, index } = useListItem({ label: props.label })

function isActive() {
  const indexVal = index()
  return indexVal === ctx.activeIndex.value && indexVal != null
}
</script>

<template>
  <div
    :ref="(el: any) => setItem(el)"
    class="text-left flex py-1 px-2 focus:bg-blue-500 focus:text-white outline-none rounded"
    role="option"
    :aria-selected="isActive()"
    :tabindex="isActive() ? 0 : -1"
    v-bind="ctx.getItemProps()"
  >
    <slot />
  </div>
</template>
