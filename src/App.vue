<script setup lang="ts">
import { Dialog, type SimplifiedProduct } from '@askdialog/dialog-sdk';
import DialogProductBlock from './components/DialogProductBlock/DialogProductBlock.vue';
const client = new Dialog({
  apiKey: 'MWJmZGZkOTItYTg4Ni00NDFmLTljZTEtZWMxNDI2ZTA0MmQ3',
  locale: 'fr',
  callbacks: {
    addToCart: () => {
      return Promise.resolve();
    },
    getProduct: () => {
      return Promise.resolve({} as SimplifiedProduct);
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
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
}
</style>
