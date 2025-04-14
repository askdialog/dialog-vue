<template>
  <div class="dialog-block-header-container">
    <div class="dialog-block-title">{{ title }}</div>
    <div class="dialog-block-description">
      {{ description }}
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'DialogBlockHeaderV2',
  props: {
    title: {
      type: String,
      required: false,
      default: 'Your expert',
    },
    description: {
      type: String,
      required: false,
      default: 'Ask me anything about this product',
    },
  },
};
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
