---
"@askdialog/dialog-sdk": minor
---

Add the optional `additionalIndexes` option to `createSearchController`: additional indexes (`collections`, …) searched in the same request as the products, on their first page, exposed under `state.additionalResults` keyed by index. Pass a function to resolve the additional indexes per request.
