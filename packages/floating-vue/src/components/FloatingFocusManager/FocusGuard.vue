<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { isSafari } from '../../utils.ts'
import { HIDDEN_STYLES, setActiveElementOnTab } from './FloatingFocusManager.ts'

const role = shallowRef<'button' | undefined>()

onMounted(() => {
  if (isSafari()) {
  // Unlike other screen readers such as NVDA and JAWS, the virtual cursor
  // on VoiceOver does trigger the onFocus event, so we can use the focus
  // trap element. On Safari, only buttons trigger the onFocus event.
  // NB: "group" role in the Sandbox no longer appears to work, must be a
  // button role.
    role.value = 'button'
  }

  document.addEventListener('keydown', setActiveElementOnTab)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', setActiveElementOnTab)
})
</script>

<template>
  <span
    tabindex="0"
    :role="role"
    :aria-hidden="role ? undefined : true"
    data-floating-ui-focus-guard=""
    :style="HIDDEN_STYLES"
  />
</template>
