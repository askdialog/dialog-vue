<template>
  <div class="dialog-block-suggestions-skeleton-item"></div>
  <div class="dialog-block-suggestions-skeleton-item"></div>
  <div class="dialog-block-suggestions-skeleton-item"></div>
</template>

<script lang="ts">
export default {
  name: 'DialogBlockSuggestionsSkeletonV2',
};
</script>

<style scoped>
.dialog-block-suggestions-skeleton-item,
.dialog-block-suggestions-skeleton-item:empty {
  display: block;
  width: 100%;
  width: 90%;
  height: 18px;
  border-radius: 18px;
  padding: 12px 16px;
  background-color: #f1f1f1;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    background-color: #f1f1f1;
  }
  50% {
    background-color: #ffffff;
  }
  100% {
    background-color: #f1f1f1;
  }
}
</style>
