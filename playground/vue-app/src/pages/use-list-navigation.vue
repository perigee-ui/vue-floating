<script setup lang="ts">
import Base from '@/components/UseListNavigation/Base.vue'
import Autocomplite from '@/components/UseListNavigation/Autocomplite.vue'
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold underline mb-6">
      <a href="https://floating-ui.com/docs/useListNavigation" target="_blank" rel="noopener noreferrer">useListNavigation</a>
    </h1>

    <div class="box before:content-['Base']">
      <Base />
    </div>
    <div class="box before:content-['Autocomplite']">
      <Autocomplite />
    </div>
  </div>
</template>
