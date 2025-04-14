<template>
  <ThemeProvider :theme="props.client.theme">
    <div class="dialog-block-container">
      <DialogBlockHeader :title="assistantName" :description="description" />
      <DialogBlockSuggestionsContainer
        :client="props.client"
        :questions="suggestionData?.questions"
        :is-loading="isFetchingSuggestions"
        :product-id="props.productId"
        :product-title="props.productTitle"
        :selected-variant-id="props?.selectedVariantId"
      />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { Dialog, type Suggestion } from '@dialog/dialog-custom-sdk';
import DialogBlockHeader from './DialogBlockHeader.vue';
import DialogBlockSuggestionsContainer from './DialogBlockSuggestionsContainer.vue';
import ThemeProvider from './ThemeProvider.vue';
import { computed, onMounted, ref } from 'vue';

interface Props {
  client: Dialog;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

const props = defineProps<Props>();
const isFetchingSuggestions = ref(true);
const suggestionData = ref<Suggestion | undefined>(undefined);

const assistantName = computed(() => {
  return suggestionData.value?.assistantName;
});
const description = computed(() => {
  return suggestionData.value?.description;
});

const handleFetchingSuggestions = async () => {
  try {
    const suggestion = await props.client.getSuggestions(props.productId);
    suggestionData.value = suggestion;
    isFetchingSuggestions.value = false;
  } catch (error) {
    console.error('error', error);
  }
};

onMounted(async () => {
  await handleFetchingSuggestions();
});
</script>

<style scoped>
.dialog-block-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 0;
  width: 100%;
  gap: 24px;
}
</style>
