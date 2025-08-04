<template>
  <div class="dialog-input-wrapper" @click="focusInput">
    <input
      id="dialog-ask-anything-input-ai-input"
      ref="inputRef"
      v-model="inputValue"
      class="dialog-ask-anything-input-ai-input"
      :placeholder="props.placeholder ?? 'Ask anything...'"
      @keydown.enter="handleSubmitQuestion"
    />

    <button
      id="send-message-button-ai-input"
      class="dialog-input-submit"
      :disabled="!inputValue.trim()"
      @click="handleSubmitQuestion"
    >
      <ArrowIcon :color="props.client.theme.ctaTextColor" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Dialog } from '@askdialog/dialog-sdk';
import ArrowIcon from '../../icons/ArrowIcon.vue';
import { ref } from 'vue';

interface Props {
  client: Dialog;
  placeholder?: string;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}

const props = defineProps<Props>();
const inputRef = ref<HTMLInputElement>();
const inputValue = ref('');

const focusInput = () => {
  inputRef.value?.focus();
};

const handleSubmitQuestion = () => {
  const question = inputValue.value;
  if (!question.trim()) {
    return;
  }

  props.client.sendProductMessage({
    productId: props.productId,
    productTitle: props.productTitle,
    selectedVariantId: props.selectedVariantId,
    question: question,
    fromQuestionSuggestion: true,
  });
  inputValue.value = '';
};
</script>

<style scoped>
.dialog-input-wrapper {
  position: relative;
  width: 100%;
  height: 50px;
  max-height: 50px;
  padding: 16px 20px;
  border: 1px solid #d9d9d9;
  border-radius: var(--dialog-theme-cta-border-type, 24px);
  background: #ffffff;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.dialog-input-container {
  display: flex;
  justify-items: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.dialog-ask-anything-input-ai-input {
  outline: unset;
  box-shadow: unset;
  border: unset;
  width: 100%;
  font-size: 16px;
  background: transparent;
  padding-right: 35px;
}

.dialog-input-submit {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--dialog-theme-primary-color);
  position: absolute;
  cursor: pointer;
  top: calc(50% - 20px);
  right: 4px;
  border: unset;
}
.dialog-input-submit:disabled {
  opacity: 0.5;
}
</style>
