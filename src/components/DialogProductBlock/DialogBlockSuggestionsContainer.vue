<template>
  <div class="dialog-block-suggestions-container">
    <DialogBlockSuggestionsSkeleton
      v-if="props.isLoading || !props.questions"
    />
    <DialogBlockSuggestions
      v-else
      :client="props.client"
      :questions="props.questions"
      :product-id="props.productId"
      :product-title="props.productTitle"
      :selected-variant-id="props.selectedVariantId"
    />
  </div>
</template>

<script setup lang="ts">
import type { Dialog, Suggestion } from '@askdialog/dialog-sdk';
import DialogBlockSuggestions from './DialogBlockSuggestions.vue';
import DialogBlockSuggestionsSkeleton from './DialogBlockSuggestionsSkeleton.vue';

const props = defineProps<{
  client: Dialog;
  questions: Suggestion['questions'] | undefined;
  isLoading: boolean;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}>();
</script>

<style scoped>
.dialog-block-suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
</style>
