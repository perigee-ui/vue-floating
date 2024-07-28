<script setup lang="ts">
import { useRoute } from 'vue-router'

const ROUTES = [
  { path: 'use-hover' },
  { path: 'use-focus' },
  { path: 'use-click' },
  { path: 'use-role' },
  { path: 'use-dismiss' },
  { path: 'use-client-point' },
  // { path: 'tooltip' },
  // { path: 'popover' },
  // { path: 'menu' },
  // { path: 'select' },
  // { path: 'mac-select' },
  // { path: 'emoji-picker' },
  // { path: 'autocomplete' },
  // { path: 'navigation' },
  // { path: 'drawer' },
  // { path: 'arrow' },
  // { path: 'menubar' },
  // { path: 'menu-virtual' },
  // { path: 'omnibox' },
  // { path: 'grid' },
  // { path: 'complex-grid' },
]

const route = useRoute()
</script>

<template>
  <div>
    <main class="p-12 lg:ml-64">
      <RouterView />
    </main>
    <nav class="fixed top-0 left-0 flex-col hidden h-full p-8 overflow-y-auto bg-slate-100 lg:w-64 lg:flex">
      <div>
        <RouterLink to="/" class="block mb-4 text-2xl font-bold">
          Tests
        </RouterLink>
      </div>

      <ul class="flex flex-col text-lg capitalize">
        <RouterLink
          v-for="({ path }) in ROUTES"
          :key="path"
          :to="`/${path}`"
          class="py-1"
          :style="{
            color: route.path === `/${path}` ? 'black' : '',
            fontWeight: route.path === `/${path}` ? 'bold' : '',
          }"
        >
          {{ path.replace('-', ' ') }}
        </RouterLink>
      </ul>
    </nav>
  </div>
</template>
