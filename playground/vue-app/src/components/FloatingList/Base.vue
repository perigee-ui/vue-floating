<script setup lang="ts">
import Select from './Select.vue'
import Option from './Option.vue'
</script>

<template>
  <div>
    <Select>
      <Option>One</Option>
      <div>
        <Option>Two</Option>
        <Option>Three</Option>
        <Option>Four</Option>
      </div>
      <Option>Five</Option>
      <Option>Six</Option>
    </Select>
  </div>
</template>
