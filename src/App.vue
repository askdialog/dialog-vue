<script setup lang="ts">
import { Dialog, type SimplifiedProduct } from '@askdialog/dialog-sdk';
import DialogProductBlock from './components/DialogProductBlock/DialogProductBlock.vue';
const client = new Dialog({
  apiKey: 'NjQ2MjQ5MGUtMzE3NS00MmE5LTgyZjgtYWNjNWE1MWE5Zjdh',
  locale: 'en',
  callbacks: {
    addToCart: () => {
      return Promise.resolve();
    },
    getProduct: () => {
      return Promise.resolve({
        title: 'Blizzard King All-Mountain Snowboard',
        description: 'description',
        descriptionHtml: 'descriptionHtml',
        featuredImage: {
          url: 'https://cdn.shopify.com/s/files/1/0631/4718/0170/files/Main_a832056e-1370-4df3-b4bc-c0d6fe253970.jpg?v=1707323464',
        },
        handle: 'blizzard-king-all-mountain-snowboard',
        id: 'gid://shopify/Product/7899322908810',
        totalInventory: 0,
        tracksInventory: true,
        hasOnlyDefaultVariant: false,
        productType: 'snowboard',
        status: 'ACTIVE',
        options: [
          {
            id: 'gid://shopify/ProductOption/10025502343306',
            name: 'Taille',
            values: ['162', '159'],
            position: 1,
            translations: [],
          },
          {
            id: 'gid://shopify/ProductOption/10025502376074',
            name: 'Fixation',
            values: ['Classique', 'Step on'],
            position: 2,
            translations: [],
          },
          {
            id: 'gid://shopify/ProductOption/10025502408842',
            name: 'Couleur',
            values: ['black', 'green', 'blue', 'pink', 'ben-design'],
            position: 3,
            translations: [],
          },
        ],
        variants: [],
        totalVariants: 20,
      } as SimplifiedProduct);
    },
  },
  theme: {
    backgroundColor: 'pink',
    primaryColor: 'red',
    ctaTextColor: 'green',
    ctaBorderType: 'straight',
    capitalizeCtas: true,
    fontFamily: 'Arial',
    highlightProductName: true,
    title: {
      fontSize: '22px',
      color: 'purple',
    },
    description: {
      color: 'blue',
      fontSize: '18px',
    },
    content: {
      color: 'green',
      fontSize: '10px',
    },
  },
});
</script>

<template>
  <div class="app-container">
    <DialogProductBlock
      :client="client"
      product-id="9403924119882"
      product-title="Product Title"
    />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
}
</style>
