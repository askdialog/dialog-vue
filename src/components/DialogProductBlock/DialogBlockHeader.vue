<template>
  <div class="dialog-block-header-container">
    <div class="dialog-block-title">{{ props.title ?? 'Title' }}</div>
    <div class="dialog-block-description">
      {{ props.description ?? 'Description' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  title?: string;
  description?: string;
}>();
console.log('@@@ Header block @@@', props.title, props.description);

watch(
  () => props.title,
  newTitle => {
    console.log('Title changed to:', newTitle);
  },
);

watch(
  () => props.description,
  newDesc => {
    console.log('Description changed to:', newDesc);
  },
);
</script>

<style scoped>
.dialog-block-header-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.dialog-block-title {
  color: #6c6c6c;
  font-family: var(--dialog-theme-font-family);
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}

.dialog-block-description {
  color: var(--dialog-theme-primary-color);
  font-family: var(--dialog-theme-font-family);
  font-size: var(--dialog-theme-title-font-size);
  font-style: normal;
  font-weight: 500;
  line-height: 20px;
}
</style>
