<script setup lang="ts">
import Base from '@/components/UseTransition/Base.vue'
import Style from '@/components/UseTransition/Style.vue'
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold underline mb-6">
      <a href="https://floating-ui.com/docs/useTransition" target="_blank" rel="noopener noreferrer">useTransition</a>
    </h1>

    <div class="box before:content-['useTransitionStatus']">
      <Base />
    </div>
    <div class="box before:content-['useTransitionStyles']">
      <Style />
    </div>
  </div>
</template>
