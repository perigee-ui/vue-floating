<script setup lang="ts">
import Base from '@/components/UseHover/Base.vue'
import Safe from '@/components/UseHover/Safe.vue'
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold underline mb-6">
      <a href="https://floating-ui.com/docs/useHover" target="_blank" rel="noopener noreferrer">useHover</a>
    </h1>

    <div class="box before:content-['Base']">
      <Base />
    </div>
    <div class="box before:content-['Safe_poligon']">
      <Safe />
    </div>
  </div>
</template>
