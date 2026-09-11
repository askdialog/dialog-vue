# @askdialog/dialog-vue

Vue 3 component library for Dialog AI-powered product assistance.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Available Components](#available-components)
  - [DialogProductBlock](#dialogproductblock)
  - [DialogInput](#dialoginput)
  - [Storefront search](#storefront-search)
    - [useDialogSearch](#usedialogsearch)
    - [DialogSearchBar](#dialogsearchbar)
    - [DialogSearchResults](#dialogsearchresults)
    - [DialogSearchPagination](#dialogsearchpagination)
- [Theming](#theming)
- [Development](#development)
- [TypeScript](#typescript)
- [Vue Version](#vue-version)

## Installation

```bash
npm install @askdialog/dialog-vue @askdialog/dialog-sdk
# or
pnpm add @askdialog/dialog-vue @askdialog/dialog-sdk
# or
yarn add @askdialog/dialog-vue @askdialog/dialog-sdk
```

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@askdialog/dialog-sdk';
import { DialogProductBlock } from '@askdialog/dialog-vue';
import '@askdialog/dialog-vue/style.css';

const client = new Dialog({
  apiKey: 'your-api-key',
  locale: 'en', currency: 'EUR',
  callbacks: {
    addToCart: () => Promise.resolve(),
    getProduct: () => Promise.resolve({
      // Product data
    }),
  },
});
</script>

<template>
  <DialogProductBlock
    :client="client"
    product-id="product-123"
    product-title="Product Name"
  />
</template>
```

## Available Components

### DialogProductBlock

Full-featured dialog component with suggestions and input.

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `selectedVariantId` (string, optional) - Selected variant ID
- `enableInput` (boolean, optional) - Enable input field (default: true)

**Example:**
```vue
<DialogProductBlock
  :client="client"
  product-id="9403924119882"
  product-title="Blizzard King All-Mountain Snowboard"
  selected-variant-id="variant-123"
  :enable-input="true"
/>
```

### DialogInput

Standalone input component for asking questions.

**Props:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `productId` (string) - Product ID (required)
- `productTitle` (string) - Product title (required)
- `placeholder` (string, optional) - Input placeholder text
- `selectedVariantId` (string, optional) - Selected variant ID

**Example:**
```vue
<DialogInput
  :client="client"
  product-id="9403924119882"
  product-title="Product Name"
  placeholder="Ask something about this product..."
/>
```

### Storefront search

`useDialogSearch` binds the SDK controller to component state. The controller manages requests and analytics; components handle rendering and navigation.

```vue
<script setup lang="ts">
import { Dialog } from '@askdialog/dialog-sdk';
import {
  DialogSearchBar,
  DialogSearchResults,
  useDialogSearch,
} from '@askdialog/dialog-vue';
import '@askdialog/dialog-vue/style.css';

const client = new Dialog({ apiKey: 'your-api-key', locale: 'en-US', currency: 'USD' });

const { controller, state } = useDialogSearch({ client, language: 'en', currency: client.currency });
</script>

<template>
  <DialogSearchBar :controller="controller" placeholder="Search products..." />
  <DialogSearchResults :controller="controller" :state="state" />
</template>
```

#### useDialogSearch

Creates one search controller per composable instance and disposes it on unmount.

**Options:**
- `client` (Dialog) - Dialog SDK client instance (required)
- `language` (string, required) - Lowercase ISO 639-1 language code, e.g. `fr`
- `currency` (string, required) - ISO 4217 currency, e.g. `EUR`
- `surface` (SearchSurface, optional) - Where results are displayed, for analytics (default: `'search_page'`)
- `navigate` ((url, hit) => void, optional) - Router adapter called after selection attribution (e.g. `(url) => router.push(url)`). Omit it to let the cards' plain `<a href>` links navigate natively.
- `debounceMs` (number, optional) - Keystroke debounce (default: 250)
- `hitsPerPage` (number, optional) - Results per page (default: 12)

Search language and currency are explicit and independent of `client.locale`, which can be a regional locale such as `fr-FR`.

Options are read once during setup — later changes don't rebind the live controller.

**Returns:** `{ controller, state }` — pass both to the components below. `state` is a `ShallowRef`; `state.value.status` is `idle` / `loading` / `success` / `empty` / `error`.

#### DialogSearchBar

Search input: typing runs a debounced search, submitting (Enter) searches immediately.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `placeholder` (string, optional) - Input placeholder text (default: `'Search products...'`)
- `autoFocus` (boolean, optional) - Focus the input on mount (default: false)
- `submitAriaLabel` (string, optional) - Accessible label of the submit button (default: `'Search'`)

#### DialogSearchResults

Floating results panel overlaying the page content: portaled to `document.body` in `position: fixed`, anchored under the spot where the component is rendered (place it right after the bar), so no ancestor stacking context or `overflow: hidden` can hide it. Renders the controller states; successful searches render a scrollable list of `DialogSearchProductCard` rows plus the pagination controls. Each card links to the product page and records search attribution (viewport impressions, select on click and middle-click) automatically. Clicking outside the panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchControllerState) - From `useDialogSearch` (required)

#### DialogSearchPagination

Previous/next controls with a page indicator; hidden while there is a single page. Rendered by `DialogSearchResults` — exported only for custom layouts.

**Props:**
- `controller` (SearchController) - From `useDialogSearch` (required)
- `state` (SearchControllerState) - From `useDialogSearch` (required)

## Theming

The components use CSS variables for theming. You can customize the theme through the Dialog SDK client:

```ts
const client = new Dialog({
  apiKey: 'your-api-key',
  theme: {
    backgroundColor: 'pink',
    primaryColor: 'pink',
    ctaTextColor: 'white',
    ctaBorderType: 'rounded',
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
```

## Development

This section is for contributors working on the library itself.

### Prerequisites

- Node.js >= 22
- pnpm >= 10

### Setup

```bash
# From monorepo root
pnpm install
```

### Development Workflows

#### Daily Development

Work on components with instant feedback:

```bash
# From monorepo root
pnpm dev:vue-example
# Opens vue-example app at http://localhost:5173
```

**What happens:**
- The example app runs with Vite dev server
- Components are resolved from **source files** (`packages/vue/src/`) via alias
- Changes to components are immediately reflected (HMR enabled)
- No rebuild required

#### Testing Built Library

Test the library as consumers would receive it from npm:

```bash
# Step 1: Build the library
pnpm build:vue

# Step 2: Run example app against built dist/
cd packages/vue-example
pnpm dev:test-dist
# Or from root: TEST_DIST=true pnpm dev:vue-example
```

**When to use:**
- Before creating a pull request
- After modifying build configuration
- To verify the build works correctly
- Before publishing a new version

### Build Commands

```bash
# Build the library only
pnpm build:vue

# Build all packages in the monorepo
pnpm build

# Clean dist folder
pnpm --filter @askdialog/dialog-vue clean

# Lint code
pnpm --filter @askdialog/dialog-vue lint

# Fix linting issues
pnpm --filter @askdialog/dialog-vue lint:fix
```

### Project Structure

```
packages/vue/
├── src/
│   ├── main.ts              # Library entry point
│   ├── components/          # Exported components
│   │   ├── index.ts         # Component barrel export
│   │   ├── DialogProductBlock/
│   │   │   ├── DialogProductBlock.vue
│   │   │   ├── DialogInput.vue
│   │   │   ├── ThemeProvider.vue
│   │   │   └── ...
│   │   └── DialogSearch/
│   │       ├── DialogSearchBar.vue
│   │       ├── DialogSearchResults.vue
│   │       ├── useDialogSearch.ts
│   │       └── ...
│   └── icons/               # Icon components
├── dist/                    # Build output (gitignored)
├── package.json
├── vite.config.ts           # Library build configuration
└── project.json             # Nx configuration
```

### Publishing

```bash
# From monorepo root
pnpm publish:vue
```

**Pre-publish checklist:**
- [ ] All tests pass
- [ ] Version updated in `package.json`
- [ ] Tested with built library (`pnpm dev:test-dist`)
- [ ] Tarball inspected with `pnpm pack`
- [ ] CHANGELOG updated

## TypeScript

This package includes TypeScript type definitions. The types are automatically available when you install the package.

## Vue Version

This package requires Vue 3 or higher as a peer dependency.

