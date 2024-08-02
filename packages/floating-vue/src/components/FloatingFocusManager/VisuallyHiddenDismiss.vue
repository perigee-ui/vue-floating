<script setup lang="ts">
import { HIDDEN_STYLES } from './FloatingFocusManager.ts'
</script>

<template>
  <button
    tabindex="-1"
    type="button"
    :style="HIDDEN_STYLES"
  />
</template>
