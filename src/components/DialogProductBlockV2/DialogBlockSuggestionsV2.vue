<template>
  <button
    v-for="question in questions"
    :key="question.question"
    class="dialog-block-suggestions-item"
    @click="handleClick(question.question)"
  >
    <AiStarsIcon
      class="dialog-block-suggestions-item-icon"
      :color="client.theme.primaryColor"
    />
    <span class="dialog-block-suggestions-item-label">
      {{ question.question }}
    </span>
  </button>
</template>

<script lang="ts">
import type { Dialog, Suggestion } from '@dialog/dialog-custom-sdk';
import AiStarsIcon from '../../icons/AiStarsIcon.vue';

export default {
  name: 'DialogBlockSuggestionsV2',
  components: {
    AiStarsIcon,
  },
  props: {
    client: {
      type: Object as () => Dialog,
      required: true,
    },
    questions: {
      type: Array as () => Suggestion['questions'],
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
      required: false,
      default: undefined,
    },
  },
  methods: {
    handleClick(question: string) {
      this.client.sendProductMessage({
        productId: this.productId,
        productTitle: this.productTitle,
        selectedVariantId: this.selectedVariantId,
        question: question,
        fromQuestionSuggestion: true,
      });
    },
  },
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
