# Dialog Vue

## Dialog

Dialog is an AI assistant designed to boost e-commerce sales by providing intelligent product recommendations and seamless customer interactions.

Visit our website: [Dialog AI Assistant](https://www.askdialog.com/)

## Description

Dialog vue is a component library designed to be used with he progressive javascript framework VueJs.

## Get started

### Prerequisites

Before using the Dialog Vue, you need:

- Our [Dialog SDK](https://www.npmjs.com/package/@askdialog/dialog-sdk) installed.
- An active API Key, you can retrieve your api key in your [organization settings](https://app.askdialog.com/settings)

### Installation

```bash
npm install @askdialog/dialog-vue
# or
pnpm add @askdialog/dialog-vue
# or
yarn add @askdialog/dialog-vue
```

### Instantiate the client

```typescript
import { Dialog } from '@askdialog/dialog-sdk';

const client = new Dialog({
  apiKey: 'YOUR_API_KEY', // required
  locale: 'TARGETED_LOCALE', // required
  callbacks: {
    addToCart: () => Promise<void>, // required
    getProduct: () => Promise<SimplifiedProduct>, // required
  },
});
```

### Use DialogProductBlock component

- Import DialogProductBlock and the default style

```typescript
import { DialogProductBlock, } from "@askdialog/dialog-vue";
import "@askdialog/dialog-vue/style.css";

<DialogProductBlock
  :client="client"
  product-id="Product identifier"
  product-title="Product Title"
  selected-variant-id="Variant identifier"
/>
```
