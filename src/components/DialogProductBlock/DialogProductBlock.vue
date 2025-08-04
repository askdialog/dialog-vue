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
      <DialogInput
        v-if="props.enableInput"
        :client="props.client"
        :placeholder="inputPlaceholder"
        :product-id="props.productId"
        :product-title="props.productTitle"
        :selected-variant-id="props?.selectedVariantId"
      />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { Dialog, type Suggestion } from '@askdialog/dialog-sdk';
import DialogBlockHeader from './DialogBlockHeader.vue';
import DialogBlockSuggestionsContainer from './DialogBlockSuggestionsContainer.vue';
import DialogInput from './DialogInput.vue';
import ThemeProvider from './ThemeProvider.vue';
import { computed, onMounted, ref } from 'vue';

interface Props {
  client: Dialog;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
  enableInput?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableInput: true,
  selectedVariantId: undefined,
});
const isFetchingSuggestions = ref(true);
const suggestionData = ref<Suggestion | undefined>(undefined);

const assistantName = computed(() => {
  return suggestionData.value?.assistantName;
});
const description = computed(() => {
  return suggestionData.value?.description;
});
const inputPlaceholder = computed(() => {
  return suggestionData.value?.inputPlaceholder;
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
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 0;
  width: fit-content;
  gap: 24px;
}
.dialog-block-container > * {
  box-sizing: border-box;
}
</style>
