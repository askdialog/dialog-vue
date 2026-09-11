# @askdialog/dialog-react

## 2.5.0

### Minor Changes

- 306f7ca: Include currency in search index names, e.g. `products_fr_usd`.

  Add required `currency` to Dialog and expose `client.currency`. The client retains its BCP-47 locale for assistant localization.

  Search controllers take `search`, `language` (ISO 639-1) and `currency` (ISO 4217). React/Vue `useDialogSearch` takes `client`, `language` and `currency`. Language and currency are required independently of the client locale. Apply them to product and additional-index queries and response matching.

  Separate request construction and result parsing from the controller. Invalidate previous responses as soon as new input arrives, including during the debounce delay.

## 2.4.0

### Minor Changes

- ce9b5c7: feat!: Algolia-shaped public search — the index name carries the locale (DAT-412)

  The public search wire now mirrors Algolia's "search multiple indices" contract on `POST /public/search/lexical`. One breaking change across the SDK and both bindings:
  - **Request**: `{ requests: [{ indexName, query, page?, hitsPerPage? }] }`. The locale travels in the index name (`products_fr`, built with the new `searchIndexName(index, locale)` export) — `locale`, `countryCode` and the `queryId` resend leave the wire. Every entry is validated strictly server-side (unknown field → 400 `Unknown parameter`; unknown index or unserved locale → 404 `Index … does not exist`).
  - **Response**: `{ results: [{ index, hits, nbHits, page, nbPages, hitsPerPage, processingTimeMS, query, queryID }] }`. Hits are flat records — `objectID` (the Shopify GID) plus the card attributes (`title`, `url`, `handle`, `imageUrl`, `priceRange` with an optional `currencyCode`); the `SearchHit.product` wrapper, `id`, `score`, `compareAtPriceRange`, `inStock` and the `SearchProduct` type are gone. `queryID` is always returned, one per entry (`clickAnalytics` gating deferred).
  - **Transport**: `searchProducts` is renamed `searchLexical` (the route is `search/lexical`, our one deliberate divergence from Algolia, keeping room for a future AI search); `dialog.search()` passes the request through untouched (the `Dialog` instance keeps `countryCode` for its own price formatting only).
  - **Search controller**: requires `locale` (React/Vue `useDialogSearch` default it to the client's), searches `products_<locale>`, and exposes the products result entry as `state.response`. Each request — pagination included — is its own query: no `queryId` resend, the analytics `query_id` comes from the result's `queryID` and the DEC-2448 envelope gains the `index` it was served from (the Algolia Insights click tuple `(index, queryID, objectID, position)`).
  - **React/Vue DialogSearch**: results and product cards read the flat hits; `useDialogSearch` drops `countryCode`.

## 2.3.1

### Patch Changes

- d2c9824: Docs: add a package README for `@askdialog/dialog-vue` (install, components, storefront search, theming) and a features table of contents to both the Vue and React READMEs. Drop the unfinished License placeholder section from the React README.

## 2.3.0

### Minor Changes

- 33c44d3: feat(search): carry the storefront market on search requests and render market pricing

  `SearchRequest` gains optional `locale` (BCP 47) and `countryCode` (ISO 3166-1 alpha-2): the backend answers with localized product titles and the Shopify Market's prices. `createSearchController` accepts the same options and stamps them on every request; `dialog.search()` defaults them from the instance's `locale`/`countryCode`. `SearchProduct` gains an optional `compareAtPriceRange` (always in `priceRange`'s currency).

  React/Vue: `DialogSearchResults` (and the product card) accept an optional `locale` prop so prices format with the storefront's conventions instead of the browser's, and render the compare-at price struck through when it beats the displayed price. `useDialogSearch` accepts `locale`/`countryCode` and forwards them to the controller.

## 2.2.1

### Patch Changes

- 89d378f: Polish the DialogSearch storefront components (DEC-2455):
  - **Panel placement.** The results panel now anchors to the search bar's real bounding box (the anchor's previous sibling) instead of the zero-height anchor, and flips above the bar when less than 200px remains below it — a bar near the viewport bottom no longer produced a zero-height panel. The panel also re-measures on viewport resize.
  - **Disposed controller.** The `useDialogSearch` facade's `dispose()` now clears its internal ref, so the next controller access creates a fresh instance instead of dispatching into the disposed one.
  - **Focus ring.** The search bar pill shows a visible focus indicator on `:focus-within`, replacing the input's suppressed native ring.
  - **Input name.** The search input carries a `name` attribute, silencing the DevTools form-field warning and making the field autofill-addressable.
  - **Outside-click dismiss.** Clicking outside the results panel (and outside the bar) closes it; typing again or re-focusing the bar reopens it with the results kept, like a native autocomplete.

## 2.2.0

### Minor Changes

- 42aea98: Add the storefront search components: `useDialogSearch` (React binding of the SDK search controller) plus `DialogSearchBar`, `DialogSearchResults`, `DialogSearchProductCard` and `DialogSearchPagination`, with DEC-2448 attribution (viewport impressions and select events) wired in.
- 9e56f79: Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

  The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.

### Patch Changes

- 3715e6d: Fix two issues in the DialogSearch storefront components (DEC-2455):
  - **Double navigation.** When `useDialogSearch` is given a `navigate` router adapter, selecting a result card ran both the adapter's client-side transition and the anchor's native navigation, causing a duplicate transition / full-page reload. `SearchController.selectResult` now takes an optional `{ navigate }` and returns `true` when the adapter handled navigation; the React card `preventDefault()`s in that case. Modified clicks (cmd/ctrl/shift/alt) and middle-clicks pass `{ navigate: false }` so they still open a new tab natively — attribution is recorded but the in-app adapter (which can't open a tab) is skipped. Without an adapter, `selectResult` returns `false` and native `<a href>` navigation proceeds unchanged.
  - **Price formatting crash.** A malformed `currencyCode` in untrusted catalog data made `Intl.NumberFormat` throw during render, which could take down the whole search results panel instead of dropping one price. `formatSearchPrice` now degrades to an empty string (no price shown) on a formatting error.

## 2.1.0

### Minor Changes

- 5eb504d: feat: register the wrapper package in window.dialog.audit (DEC-2368)

  `DialogProductBlock` now registers its integration (`react` / `vue`) and package version on the shared audit surface `window.dialog.audit` when it mounts, alongside the SDK's own entry — so support can tell a React/Vue integration apart from direct SDK usage from the browser console.

## 2.0.2

### Patch Changes

- 8b645e1: fix: widen the `@askdialog/dialog-sdk` peer dependency to `^2.0.1`

  The peer was pinned to the exact version `2.0.0`, so installing the latest
  `@askdialog/dialog-sdk@2.0.1` alongside `dialog-react`/`dialog-vue` produced a
  peer-dependency mismatch warning (and an `ERESOLVE` error under strict peer
  resolution). The peer is now a caret range (`^2.0.1`), accepting any compatible
  `2.x` SDK release.

## 2.0.1

### Patch Changes

- fix: republish with the correct `@askdialog/dialog-sdk` peer dependency (OPS-650). The `2.0.0` `latest` artifact shipped a stale `@askdialog/dialog-sdk@1.2.0` peer; this release ships the correct `2.0.x` peer metadata.

## 2.0.0

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [ba085c0]
  - @askdialog/dialog-sdk@2.0.0-beta.1

## 2.0.0-beta.1

### Patch Changes

- Updated dependencies [8b8c1a9]
  - @askdialog/dialog-sdk@1.2.0-beta.0

## 1.0.1-beta.0

### Patch Changes

- 02ecd59: fix(product-block): suppress English placeholder flash during suggestions fetch (OPS-589)

  `DialogProductBlock` no longer renders English default placeholders (`"Your expert"`, `"A question about this product?"`, `"Ask anything..."`) while `getSuggestions` is in flight. Title, description, and input placeholder render empty until the localized response arrives, eliminating the visible English → target-language re-render on multi-locale storefronts. Also hardens the fetch lifecycle: resets loading state on each `productId`/`client` change, clears loading in `finally` on errors, and guards against out-of-order responses overwriting newer data.

## 1.0.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib
- Updated dependencies [354db6b]
- Updated dependencies [9200579]
  - @askdialog/dialog-sdk@1.1.0

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies [354db6b]
  - @askdialog/dialog-sdk@1.1.0-beta.3

## 0.1.1-beta.0

### Patch Changes

- c4f83c7: Initial release of Dialog official React Component lib

## 0.1.0

### Minor Changes

- Initial release of React component library for Dialog AI-powered product assistance
- DialogProductBlock component with suggestions and input
- DialogInput standalone component
- Theme support via CSS variables
- TypeScript support with full type definitions
- React 19 support

### Dependencies

- @askdialog/dialog-sdk@^1.0.0
