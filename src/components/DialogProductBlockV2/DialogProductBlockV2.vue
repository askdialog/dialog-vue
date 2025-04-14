<template>
  <div class="dialog-block-container">
    <div>Debug values: shouldShowHeader: {{ shouldShowHeader }}</div>
    <DialogBlockHeaderV2
      v-if="shouldShowHeader"
      :title="assistantName"
      :description="description"
    />
    <DialogBlockSuggestionsContainerV2
      :client="client"
      :questions="suggestionData?.questions"
      :is-loading="isFetchingSuggestions"
      :product-id="productId"
      :product-title="productTitle"
      :selected-variant-id="selectedVariantId"
    />
  </div>
</template>

<script lang="ts">
import { Dialog, type Suggestion } from '@dialog/dialog-custom-sdk';
import DialogBlockHeaderV2 from './DialogBlockHeaderV2.vue';
import DialogBlockSuggestionsContainerV2 from './DialogBlockSuggestionsContainerV2.vue';

console.log('DialogProductBlockV2');
export default {
  name: 'DialogProductBlockV2',
  components: {
    DialogBlockHeaderV2,
    DialogBlockSuggestionsContainerV2,
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
    shouldShowHeader() {
      return !this.isFetchingSuggestions && !!this.suggestionData;
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
</style>
