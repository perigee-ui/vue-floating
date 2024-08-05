<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeUnmountFocusGuard, onMountFocusGuard, role } from './FocusGuard.ts'

onMounted(onMountFocusGuard)

onBeforeUnmount(onBeforeUnmountFocusGuard)
</script>

<template>
  <span
    tabindex="0"
    :role="role"
    :aria-hidden="role ? undefined : true"
    data-floating-ui-focus-guard=""
    style="border: 0px; clip: rect(0px, 0px, 0px, 0px); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: fixed; white-space: nowrap; width: 1px; top: 0px; left: 0px;"
  />
</template>
