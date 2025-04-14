<template>
  <div class="dialog-block-container">
    <div>Debug values: shouldShowHeader: {{ shouldShowHeader }}</div>

    <DialogBlockHeader
      :key="updateKey"
      :title="assistantName"
      :description="description"
    />
    <DialogBlockSuggestionsContainer
      :client="props.client"
      :questions="suggestionData?.questions"
      :is-loading="isFetchingSuggestions"
      :product-id="props.productId"
      :product-title="props.productTitle"
      :selected-variant-id="props?.selectedVariantId"
    />
  </div>
</template>

<script setup lang="ts">
/*
<ThemeProvider :theme="props.client.theme">
    <div class="dialog-block-container">
      <DialogBlockHeader
        :title="suggestionData?.assistantName"
        :description="suggestionData?.description"
      />
      <DialogBlockSuggestionsContainer
        :client="props.client"
        :questions="suggestionData?.questions"
        :is-loading="isFetchingSuggestions"
        :product-id="props.productId"
        :product-title="props.productTitle"
        :selected-variant-id="props?.selectedVariantId"
      />
    </div>
  </ThemeProvider>*/

import { Dialog, type Suggestion } from '@dialog/dialog-custom-sdk';
import DialogBlockHeader from './DialogBlockHeader.vue';
import DialogBlockSuggestionsContainer from './DialogBlockSuggestionsContainer.vue';
// import ThemeProvider from './ThemeProvider.vue';
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
  client: Dialog;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

const props = defineProps<Props>();
const isFetchingSuggestions = ref(true);
const suggestionData = ref<Suggestion | undefined>(undefined);
const updateKey = ref(0);

const assistantName = computed(() => {
  console.log('Computing assistantName:', suggestionData.value?.assistantName);
  return suggestionData.value?.assistantName;
});
const description = computed(() => {
  console.log('Computing description:', suggestionData.value?.description);
  return suggestionData.value?.description;
});
const shouldShowHeader = computed(() => {
  return !isFetchingSuggestions.value && !!suggestionData.value;
});

watch(
  suggestionData,
  async newVal => {
    console.log('@@@ Suggestion data changed @@@', newVal);
    updateKey.value++;
  },
  { deep: true, immediate: true },
);

const handleFetchingSuggestions = async () => {
  try {
    const suggestion = await props.client.getSuggestions(props.productId);
    console.log('@@@@ Suggestion fetched @@@', suggestion);
    suggestionData.value = suggestion;
    console.log('@@@@ suggestionData  after @@@', suggestionData.value);
    isFetchingSuggestions.value = false;
    updateKey.value++;
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
