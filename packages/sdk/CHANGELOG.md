# @askdialog/dialog-sdk

## 2.11.0

### Minor Changes

- a4d2fb7: Add the optional `sections` option to `createSearchController`: extra indices (`collections`, …) searched in the same request as the products, on their first page, exposed under `state.sections` keyed by index. Pass a function to resolve the sections per request.

## 2.10.0

### Minor Changes

- ce9b5c7: feat!: Algolia-shaped public search — the index name carries the locale (DAT-412)

  The public search wire now mirrors Algolia's "search multiple indices" contract on `POST /public/search/lexical`. One breaking change across the SDK and both bindings:
  - **Request**: `{ requests: [{ indexName, query, page?, hitsPerPage? }] }`. The locale travels in the index name (`products_fr`, built with the new `searchIndexName(index, locale)` export) — `locale`, `countryCode` and the `queryId` resend leave the wire. Every entry is validated strictly server-side (unknown field → 400 `Unknown parameter`; unknown index or unserved locale → 404 `Index … does not exist`).
  - **Response**: `{ results: [{ index, hits, nbHits, page, nbPages, hitsPerPage, processingTimeMS, query, queryID }] }`. Hits are flat records — `objectID` (the Shopify GID) plus the card attributes (`title`, `url`, `handle`, `imageUrl`, `priceRange` with an optional `currencyCode`); the `SearchHit.product` wrapper, `id`, `score`, `compareAtPriceRange`, `inStock` and the `SearchProduct` type are gone. `queryID` is always returned, one per entry (`clickAnalytics` gating deferred).
  - **Transport**: `searchProducts` is renamed `searchLexical` (the route is `search/lexical`, our one deliberate divergence from Algolia, keeping room for a future AI search); `dialog.search()` passes the request through untouched (the `Dialog` instance keeps `countryCode` for its own price formatting only).
  - **Search controller**: requires `locale` (React/Vue `useDialogSearch` default it to the client's), searches `products_<locale>`, and exposes the products result entry as `state.response`. Each request — pagination included — is its own query: no `queryId` resend, the analytics `query_id` comes from the result's `queryID` and the DEC-2448 envelope gains the `index` it was served from (the Algolia Insights click tuple `(index, queryID, objectID, position)`).
  - **React/Vue DialogSearch**: results and product cards read the flat hits; `useDialogSearch` drops `countryCode`.

- d2935c9: New optional constructor option `product` (`{ id: string; variantId?: string }`) and instance methods `setCurrentProduct(productId, variantId?)` / `clearCurrentProduct()` to declare the product of the current page. The SDK writes it as `data-product-id` / `data-variant-id` on the mounted `#dialog-shopify-ai` div; the assistant runtime uses it as the conversation's product context for entry points that carry no product of their own (floating bookmark, resume surface, free-text questions), so answers stay grounded on the PDP under the shopper's eyes after page-to-page navigation (DEC-2618).

  Default behavior is unchanged: without the option the mount node carries no product keys and the assistant behaves as before.

  ```ts
  new Dialog({
    apiKey,
    locale,
    product: { id: "6980" }, // the PDP's product id, per the Dialog feed
  });
  // SPA navigation:
  client.setCurrentProduct("7001");
  client.clearCurrentProduct();
  ```

## 2.9.1

### Patch Changes

- 0296ecd: Search requests now send the locale as its bare ISO 639-1 language (`fr-FR` -> `fr`), whatever tag the caller holds. The search backend keys its indexes on the bare language, so a region-tagged locale no longer reaches the wire. Applies to every search path: `dialog.search()`, the search controller, and the standalone `searchProducts` transport. An unparsable locale is sent as-is.

## 2.9.0

### Minor Changes

- 33c44d3: feat(search): carry the storefront market on search requests and render market pricing

  `SearchRequest` gains optional `locale` (BCP 47) and `countryCode` (ISO 3166-1 alpha-2): the backend answers with localized product titles and the Shopify Market's prices. `createSearchController` accepts the same options and stamps them on every request; `dialog.search()` defaults them from the instance's `locale`/`countryCode`. `SearchProduct` gains an optional `compareAtPriceRange` (always in `priceRange`'s currency).

  React/Vue: `DialogSearchResults` (and the product card) accept an optional `locale` prop so prices format with the storefront's conventions instead of the browser's, and render the compare-at price struck through when it beats the displayed price. `useDialogSearch` accepts `locale`/`countryCode` and forwards them to the controller.

### Patch Changes

- 42c67c6: Add the optional `handle` field to `SearchProduct`, so Shopify storefronts can build `/products/{handle}` links when the indexed document carries no `url` (DEC-2543).

## 2.8.1

### Patch Changes

- bbf8642: Set `data-ot-ignore` on the assistant script BEFORE assigning `src`, so the `ignoreOneTrustAutoBlock` flag actually works.

  OneTrust's `OtAutoBlock.js` patches `document.createElement` and traps the `src` property setter of dynamically created scripts: the `hasAttribute("data-ot-ignore")` check runs synchronously at the moment `src` is assigned, and a blocked script is rewritten to `type="text/plain"` on the spot — never re-evaluated. The attribute was previously set one line after `src`, so it landed too late: the script ended up carrying `data-ot-ignore` in the DOM while already neutralized for visitors who declined cookies.

## 2.8.0

### Minor Changes

- 1bff0fd: New optional constructor flag `disableAddToCart` (type `boolean`, default `false`). When set, the SDK flags the injected assistant (via `data-disable-add-to-cart` on the mounted `#dialog-shopify-ai` div) so it hides the add-to-cart CTA on both product recommendation and conversational product cards, and `addToCart()` becomes a no-op — it never invokes the merchant `callbacks.addToCart` and emits no `TRACK_ADD_TO_CART` event, so a stale UI cannot add to the cart or pollute analytics. Product links and recommendation browsing are unaffected.

  Context: merchants with a B2B flow that hides purchasing actions for logged-in B2B shoppers (e.g. Tikamoon) needed a per-session way to disable Dialog add-to-cart. Default behavior is unchanged for existing clients: omit the flag (or set it to `false`) and the add-to-cart CTA and analytics behave exactly as before.

  ```ts
  new Dialog({
    apiKey,
    locale,
    disableAddToCart: true, // hide add-to-cart for this widget instance/session
  });
  ```

- 9e56f79: Add RTL support to the DialogProductBlock (PDP "Ask a question" widget). The block now resolves the text direction from the client locale (Arabic, Hebrew, Persian, Urdu) and sets `dir="rtl"` on its root, and its directional styles use logical properties (`text-align: start`, `padding-inline-end`, `inset-inline-end`) so the header, suggestion chips and input mirror correctly.

  The direction helpers (`isRtlLanguageCode`, `resolveTextDirection`) live in the SDK alongside the other localization utilities and are shared by the React and Vue packages.

### Patch Changes

- 3715e6d: Fix two issues in the DialogSearch storefront components (DEC-2455):
  - **Double navigation.** When `useDialogSearch` is given a `navigate` router adapter, selecting a result card ran both the adapter's client-side transition and the anchor's native navigation, causing a duplicate transition / full-page reload. `SearchController.selectResult` now takes an optional `{ navigate }` and returns `true` when the adapter handled navigation; the React card `preventDefault()`s in that case. Modified clicks (cmd/ctrl/shift/alt) and middle-clicks pass `{ navigate: false }` so they still open a new tab natively — attribution is recorded but the in-app adapter (which can't open a tab) is skipped. Without an adapter, `selectResult` returns `false` and native `<a href>` navigation proceeds unchanged.
  - **Price formatting crash.** A malformed `currencyCode` in untrusted catalog data made `Intl.NumberFormat` throw during render, which could take down the whole search results panel instead of dropping one price. `formatSearchPrice` now degrades to an empty string (no price shown) on a formatting error.

## 2.7.0

### Minor Changes

- 3bc99c2: Export the `searchProducts` transport so search-only integrations (Shopify theme-embed autocomplete) can call `POST /public/search` without instantiating `Dialog`, whose constructor loads the assistant runtime.

## 2.6.1

### Patch Changes

- e7eca26: fix(sdk): point the production flavor at the real prod monolith (DEC-2453)

  `monolithApiUrl` was baked to a raw execute-api gateway URL that answers 500 on every route; the production monolith is served on its custom domain `https://api.askdialog.ai` (the dashboard's `VITE_MONOLITH_API_URL`). `dialog.search()` in production was failing with a generic Internal Server Error.

## 2.6.0

### Minor Changes

- 4167926: feat(sdk): add the framework-agnostic search controller `createSearchController()` (DEC-2459)

  Stateful search behavior around the stateless `dialog.search()` transport, shared by all integrations (raw JavaScript, React, Vue, Shopify): debounce with immediate explicit submission (`setQuery`/`submit`), cancellation of the in-flight request, stale-response protection via a request generation id (a late response never replaces newer results, even when transport cancellation is ignored), pagination that resets on a new query (`setPage`), subscribable `idle`/`loading`/`success`/`empty`/`error` states (`subscribe`/`getState`), `retry` and `dispose`.

  The controller also owns the DEC-2448 attribution: viewport impressions through `observeResult(element, index)`, click attribution through `selectResult(index)` (forced impression + `select_search_result`) recorded before handing navigation to the optional `navigate` adapter, the zero-items `view_search_results` on a no-results state, and a `query_id` that stays stable while the query text is unchanged.

  New exports: `createSearchController`, `SearchStatus` and the `SearchController*` types. The raw JavaScript demo (`packages/search-example`) now runs entirely on the shared controller.

## 2.5.0

### Minor Changes

- d7b40cb: New optional constructor flag `ignoreOneTrustAutoBlock` (default `false`). When set, the SDK adds `data-ot-ignore` on the assistant script it injects, so OneTrust auto-blocking does not neutralize it for visitors who declined cookies.

  Context: a `data-ot-ignore` placed by the merchant on their own SDK `<script>` tag only covers that tag — OneTrust auto-blocking also intercepts dynamically injected scripts by domain, which left the assistant unavailable to visitors who refused consent. The assistant gates analytics on consent internally (nothing is sent without an explicit opt-in), so loading it is safe; exempting it from the CMP nonetheless remains the merchant's compliance decision, hence opt-in.

  ```ts
  new Dialog({
    apiKey,
    locale,
    ignoreOneTrustAutoBlock: true, // only for OneTrust auto-blocking setups
  });
  ```

## 2.4.0

### Minor Changes

- 98f000d: feat(sdk): expose enriched added-product data in add-to-cart surfaces (DEC-2336)

  `Dialog.addToCart` / `registerAddToCartEvent` now accept optional enriched fields describing the product actually added to cart — `productTitle`, `variantTitle`, `productUrl` — plus the PDP-context product under `pageProductId` / `pageVariantId`. The full input is forwarded to the merchant `callbacks.addToCart` and to the `TRACK_ADD_TO_CART` event, and the `userAddedToCart` assistant event payload type declares the same fields.

  This lets merchant analytics integrations (e.g. GA forwarding) track a Dialog-suggested product added from another product's PDP without resolving product data from the page context (which describes the visited PDP product, not the added one).

  All new fields are optional: existing integrations and older assistant versions keep working unchanged.

- 79f86f9: feat(sdk): add typed `dialog.search()` and make commerce callbacks optional (DEC-2447)

  New `dialog.search(request, options?)` method: a typed product search through the Nest public endpoint (`POST /public/search`). Stateless one-POST-per-call — no debounce, cache or retry; the caller owns cancellation through `options.signal`. Returns the Algolia-shaped envelope (`queryId`, `hits[].product` cards with title/image/priceRange/inStock, pagination) and throws a `DialogSearchError` carrying `status` and `code` on failure. New exports: `DialogSearchError` and the `SearchRequest`/`SearchResponse`/`SearchOptions` types.

  Commerce callbacks (`addToCart`, …) are now optional at construction, so search-only integrations can do `new Dialog({ apiKey, locale })` without wiring cart handlers; commerce entry points throw a descriptive error if invoked without them.

## 2.3.0

### Minor Changes

- 0a4f438: feat(sdk): merge `window.dialog` defensively and register installation audit metadata (DEC-2368)

  The constructor no longer overwrites `window.dialog` wholesale: fields owned by other installation paths (e.g. GTM's `setVariant`/`getVariant` and its pre-init `_queue`) are now preserved. `window.dialog.instance` and `window.dialog.version` keep working unchanged.

  The SDK also registers itself on the new shared audit surface `window.dialog.audit` (`methods` entry `{ method: 'sdk', version }`), so support can identify the installation path and version from the browser console. New exports: `registerDialogInstallation`, `addAuditCapability`, `exposeSdkOnWindowDialog` and the `DialogAudit*` types — the React/Vue wrappers use them to register their own entries.

## 2.2.0

### Minor Changes

- 78a5b40: `registerSubmitCheckoutEvent` now accepts an order-level payload: the order total (`orderValue`) plus optional `currency`, `transactionId` and `items[]`, sent once per completed order. This is what the dashboard's "Revenue generated" reads.

  The previous per-line signature (`{ productId, quantity, price }`) carried no order total, so revenue resolved to 0 for SDK-based integrations. It is now **deprecated but still accepted** — existing installs keep working after upgrading; migrate at your own pace.

  ```ts
  // preferred — once per order, with the total
  client.registerSubmitCheckoutEvent({
    orderValue: 59.98,
    currency: "EUR",
    transactionId: "ORDER-123",
    items: [{ productId, quantity, price, variantId }], // optional, attribution only
  });

  // still works (deprecated) — per line, no order total
  client.registerSubmitCheckoutEvent({
    productId,
    quantity,
    price,
    currency,
    variantId,
  });
  ```

  `registerAddToCartEvent` is unchanged.

## 2.1.0

### Minor Changes

- 597ad48: feat(sdk): add optional `countryCode` constructor parameter

  `Dialog` now accepts an optional `countryCode` (ISO 3166 alpha-2, e.g. `'FR'`, `'US'`). When provided it becomes the **effective region** and takes precedence over the region embedded in `locale`.

  Region resolution precedence:
  1. the explicit `countryCode` parameter (when a valid 2-letter code);
  2. the region embedded in `locale` (e.g. `en-US` → `US`);
  3. the region guessed from the language via `Intl.Locale.maximize()`.

  The effective region drives:
  - `data-country-code` — the price-formatting region;
  - `data-language` — the language display name, so `locale: 'en'` + `countryCode: 'GB'` resolves to `"British English"` (previously the variant only followed the locale).

  `data-shop-iso-code` is now always the **bare language subtag** (`fr`, `en`), never region-qualified. This keeps the assistant's `${language}-${countryCode}` price composition valid on every assistant version (fixing the `fr-FR-FR` class of crash) and preserves the backend's product-name translation lookup, which is keyed by a bare 2-letter locale.

  A bare language code with no explicit region keeps a generic language name (`'fr'` → `"French"`). The parameter is optional, so integrations that only pass `locale` keep their current behavior.

## 2.0.1

### Patch Changes

- fix(localization): derive language name from full locale so region variants are preserved. `getDetailedLocaleInfo` now names the language from `localeObj.baseName` (e.g. `en-GB` → "British English") instead of the bare language subtag.

## 2.0.0

### Major Changes

- ba085c0: feat(sdk)!: remove the SDK's own PostHog instance

  BREAKING CHANGE: the SDK no longer instantiates PostHog. It now only emits
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events; the host app is
  responsible for capturing them (e.g. shopify-assistant's tracking bridge
  forwarding into its single PostHog instance). This removes the second PostHog
  instance that previously ran alongside the host app.

  Removed: the `Tracking` class export, the `TrackingEvents` enum, the `posthog-js`
  dependency, and the `posthogApiKey` config field.

  Migration: any consumer relying on the SDK to send add-to-cart / checkout events
  to PostHog on its own must now listen for the emitted events and forward them.
  Consumers without such a bridge will stop reporting these events.

## 2.0.0-beta.1

### Major Changes

- ba085c0: feat(sdk)!: remove the SDK's own PostHog instance

  BREAKING CHANGE: the SDK no longer instantiates PostHog. It now only emits
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events; the host app is
  responsible for capturing them (e.g. shopify-assistant's tracking bridge
  forwarding into its single PostHog instance). This removes the second PostHog
  instance that previously ran alongside the host app.

  Removed: the `Tracking` class export, the `TrackingEvents` enum, the `posthog-js`
  dependency, and the `posthogApiKey` config field.

  Migration: any consumer relying on the SDK to send add-to-cart / checkout events
  to PostHog on its own must now listen for the emitted events and forward them.
  Consumers without such a bridge will stop reporting these events.

## 1.2.0-beta.0

### Minor Changes

- 8b8c1a9: feat(sdk): forward add-to-cart & checkout tracking to the host app

  `registerAddToCartEvent` and `registerSubmitCheckoutEvent` now also emit
  `TRACK_ADD_TO_CART` / `TRACK_SUBMIT_CHECKOUT` external events (via the
  `enableDialogAssistantEvent` CustomEvent) so a host app can capture them through
  its own PostHog instance, avoiding a second PostHog instance on the page. The
  SDK still tracks to its own PostHog for now — this is the additive first step;
  removing the SDK's PostHog instance is a follow-up breaking change.

  `EventsHandler` gains `notifyConsumerReady()` / `notifyConsumerGone()` and
  buffers tracking events until a consumer is ready, so events fired before the
  host listener attaches are flushed rather than lost. `Dialog.eventsHandler` is
  now exposed publicly so hosts can signal readiness.

## 1.1.0

### Minor Changes

- 354db6b: Add price field in the tracking (Add-to-cart & Checkout)

### Patch Changes

- 9200579: Setup changeset and monorepo

## 1.1.0-beta.3

### Minor Changes

- 354db6b: Add price field in the tracking (Add-to-cart & Checkout)

## 1.0.26-beta.2

### Patch Changes

- 9200579: Setup changeset and monorepo
