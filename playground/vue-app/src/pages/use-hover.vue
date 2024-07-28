<script setup lang="ts">
import Base from '@/components/UseHover/Base.vue'
import Safe from '@/components/UseHover/Safe.vue'
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold underline mb-6">
      <a href="https://floating-ui.com/docs/useHover" target="_blank" rel="noopener noreferrer">useHover</a>
    </h1>

    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[20rem] mb-4">
      <Base />
      <Safe />
    </div>
  </div>
</template>
