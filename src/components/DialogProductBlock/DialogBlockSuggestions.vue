<template>
  <button
    v-for="question in props.questions"
    :key="question.question"
    class="dialog-block-suggestions-item"
    @click="handleClick(question.question)"
  >
    <AiStarsIcon
      class="dialog-block-suggestions-item-icon"
      :color="props.client.theme.primaryColor"
    />
    <span class="dialog-block-suggestions-item-label">
      {{ question.question }}
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Dialog, Suggestion } from '@dialog/dialog-custom-sdk';
import AiStarsIcon from '../../icons/AiStarsIcon.vue';

const props = defineProps<{
  client: Dialog;
  questions: Suggestion['questions'];
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}>();

const handleClick = (question: string) => {
  props.client.sendProductMessage({
    productId: props.productId,
    productTitle: props.productTitle,
    selectedVariantId: props.selectedVariantId,
    question: question,
    fromQuestionSuggestion: true,
  });
};
</script>

<style scoped>
.dialog-block-suggestions-item {
  border-radius: 18px;
  background-color: #f1f1f1;
  animation: pulse 1.5s ease-in-out infinite;
  border: none;
  outline: none;
  padding: 12px 16px;
  width: fit-content;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  background-color: white;
  align-items: center;
  gap: 8px;
  border: 1px solid #dddce2;
  border-radius: 24px;
}
.dialog-block-suggestions-item-label {
  color: #575665;
  font-size: var(--dialog-theme-content-font-size);
  font-weight: 500;
}
.dialog-block-suggestions-item-icon {
  path {
    stroke: var(--dialog-theme-primary-color);
  }
}
</style>
