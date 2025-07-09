<template>
  <div class="dialog-block-header-container">
    <div class="dialog-block-title">{{ props.title ?? 'Your expert' }}</div>
    <div class="dialog-block-description">
      {{ props.description ?? 'A question about this product?' }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<style scoped>
.dialog-block-header-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.dialog-block-title {
  color: var(--dialog-theme-title-color, #272727);
  font-family: var(--dialog-theme-font-family);
  font-size: var(--dialog-theme-title-font-size);
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}

.dialog-block-description {
  color: var(--dialog-theme-description-color, #6c6c6c);
  font-family: var(--dialog-theme-font-family);
  font-size: var(--dialog-theme-description-font-size);
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
}
</style>
