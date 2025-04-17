<template>
  <div class="dialog-block-container">
    <div class="dialog-block-header-container">
      <div class="dialog-block-title">
        {{ assistantName }}
      </div>
      <div class="dialog-block-description">
        {{ description }}
      </div>
    </div>
    <div class="dialog-block-suggestions-container">
      <template v-if="isLoading">
        <div class="dialog-block-suggestions-skeleton-item"></div>
        <div class="dialog-block-suggestions-skeleton-item"></div>
        <div class="dialog-block-suggestions-skeleton-item"></div>
      </template>
      <template v-else>
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
    </div>
  </div>
</template>

<script lang="ts">
import { Dialog, type Suggestion } from '@dialog/dialog-custom-sdk';
import AiStarsIcon from '../../icons/AiStarsIcon.vue';

export default {
  name: 'DialogProductBlockV3',
  components: {
    AiStarsIcon,
  },
  props: {
    client: {
      type: Object as () => Dialog,
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
  data() {
    return {
      isFetchingSuggestions: true,
      suggestionData: undefined as Suggestion | undefined,
    };
  },
  computed: {
    assistantName() {
      return this.suggestionData?.assistantName;
    },
    description() {
      return this.suggestionData?.description;
    },
    isLoading() {
      return this.isFetchingSuggestions || !this.suggestionData;
    },
    questions() {
      return this.suggestionData?.questions;
    },
  },
  mounted() {
    console.log('Mounted');
    this.handleFetchingSuggestions();
  },
  methods: {
    async handleFetchingSuggestions() {
      try {
        console.log('Fetching suggestions');
        const suggestion = await this.client.getSuggestions(this.productId);
        this.suggestionData = suggestion;
        this.isFetchingSuggestions = false;
        console.log('Fetched', suggestion);
      } catch (error) {
        console.error('error', error);
      }
    },
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
.dialog-block-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 0;
  width: 100%;
  gap: 24px;
}
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
.dialog-block-suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
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
