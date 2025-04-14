<script setup lang="ts">
import { Dialog, type Product } from '@dialog/dialog-custom-sdk';
import DialogProductBlock from './components/DialogProductBlock/DialogProductBlock.vue';
import DialogProductBlockV2 from './components/DialogProductBlockV2/DialogProductBlockV2.vue';
import DialogProductBlockV3 from './components/DialogProductBlockV3/DialogProductBlockV3.vue';
const client = new Dialog({
  apiKey: 'MWJmZGZkOTItYTg4Ni00NDFmLTljZTEtZWMxNDI2ZTA0MmQ3',
  locale: 'fr',
  callbacks: {
    addToCart: () => {
      return Promise.resolve();
    },
    getProduct: () => {
      return Promise.resolve({} as Product);
    },
  },
});
</script>

<template>
  <div class="app-container">
    <DialogProductBlock
      :client="client"
      product-id="7899322908810"
      product-title="Product Title"
      selected-variant-id="1234567890"
    />

    <DialogProductBlockV2
      :client="client"
      product-id="7899322908810"
      product-title="Product Title"
      selected-variant-id="1234567890"
    />

    <DialogProductBlockV3
      :client="client"
      product-id="7899322908810"
      product-title="Product Title"
      selected-variant-id="1234567890"
    />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
}
</style>
