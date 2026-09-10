---
"@askdialog/dialog-sdk": minor
"@askdialog/dialog-react": minor
"@askdialog/dialog-vue": minor
---

Include currency in search index names, e.g. `products_fr_usd`.

Add required `currency` to Dialog and expose `client.currency`. The client retains its BCP-47 locale for assistant localization.

Search controllers and React/Vue `useDialogSearch` take `client`, `language` (ISO 639-1) and `currency` (ISO 4217). Language and currency are required independently of the client locale. Apply them to product and additional-index queries and response matching.

Separate request construction and result parsing from the controller. Invalidate previous responses as soon as new input arrives, including during the debounce delay.

Name additional search indexes with `AdditionalSearchIndex`, configure them through `additionalIndexes`, and expose their results in `state.additionalResults`.
