<template>
  <div class="dialog-block-suggestions-container">
    <DialogBlockSuggestionsSkeletonV2 v-if="isLoading || !questions" />
    <DialogBlockSuggestionsV2
      v-else
      :client="client"
      :questions="questions"
      :product-id="productId"
      :product-title="productTitle"
      :selected-variant-id="selectedVariantId"
    />
  </div>
</template>

<script lang="ts">
import type { Dialog, Suggestion } from '@dialog/dialog-custom-sdk';
import DialogBlockSuggestionsV2 from './DialogBlockSuggestionsV2.vue';
import DialogBlockSuggestionsSkeletonV2 from './DialogBlockSuggestionsSkeletonV2.vue';

export default {
  name: 'DialogBlockSuggestionsContainerV2',
  components: {
    DialogBlockSuggestionsV2,
    DialogBlockSuggestionsSkeletonV2,
  },
  props: {
    client: {
      type: Object as () => Dialog,
      required: true,
    },
    questions: {
      type: Array as () => Suggestion['questions'],
      default: undefined,
    },
    isLoading: {
      type: Boolean,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
    },
    selectedVariantId: {
      type: String,
      default: undefined,
    },
  },
};
</script>

<style scoped>
.dialog-block-suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
</style>
