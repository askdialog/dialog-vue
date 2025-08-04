<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 16.6667V3.33334M10 3.33334L5 8.33334M10 3.33334L15 8.33334"
      :stroke="props.color || '#ffffff'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  color?: string;
}>();
</script>
