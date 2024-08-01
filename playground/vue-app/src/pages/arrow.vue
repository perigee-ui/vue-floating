<script setup lang="ts">
import type { Placement } from '@perigee-ui/floating-vue/core'
import Demo from '@/components/FloatingArrow/Demo.vue'

const allPlacements = ['top', 'bottom', 'right', 'left'].flatMap(
  placement => [placement, `${placement}-start`, `${placement}-end`] as Placement[],
)

const borderWidth = 1
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold">
      Arrow
    </h1>
    <h2 class="text-xl font-bold mb-6 my-8">
      Slight transparency
    </h2>
    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[24rem] mb-4">
      <Demo
        v-for="placement in allPlacements"
        :key="placement"
        :placement="placement"
        :arrow-props="{
          fill: 'rgba(0,0,0,0.75)',
        }"
        floating-class="bg-black/75 text-white p-2"
      />
    </div>

    <h2 class="text-xl font-bold mb-6 mt-10">
      tipRadius={2}
    </h2>
    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[24rem] mb-4">
      <Demo
        v-for="placement in allPlacements"
        :key="placement"
        :placement="placement"
        :arrow-props="{
          tipRadius: 2,
        }"
      />
    </div>

    <h2 class="text-xl font-bold mb-6 mt-10">
      tipRadius={5}
    </h2>
    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[24rem] mb-4">
      <Demo
        v-for="placement in allPlacements"
        :key="placement"
        :placement="placement"
        :arrow-props="{
          tipRadius: 5,
        }"
      />
    </div>

    <h2 class="text-xl font-bold mb-6 mt-10">
      Transparent stroke + tipRadius
    </h2>
    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[24rem] mb-4">
      <Demo
        v-for="placement in allPlacements"
        :key="placement"
        :placement="placement"
        :floating-style="{
          border: `${borderWidth}px solid rgba(0,0,0,0.4)`,
          color: 'black',
          backgroundColor: 'white',
        }"
        :arrow-props="{
          fill: 'white',
          stroke: 'rgba(0,0,0,0.4)',
          strokeWidth: borderWidth,
          tipRadius: 1,
        }"
      />
    </div>

    <h2 class="text-xl font-bold mb-6 mt-10">
      Tailwind classNames for fill and stroke
    </h2>
    <div class="grid grid-cols-3 place-items-center border border-slate-400 rounded lg:w-[40rem] h-[24rem] mb-4">
      <Demo
        v-for="placement in allPlacements"
        :key="placement"
        :placement="placement"
        floating-class="border border-pink-500 text-pink-500 bg-white p-2"
        :arrow-props="{
          class:
            'fill-white [&>path:first-of-type]:stroke-pink-500 [&>path:last-of-type]:stroke-white',
          strokeWidth: 1,
        }"
      />
    </div>
  </div>
</template>
