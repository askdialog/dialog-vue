---
"@askdialog/dialog-sdk": minor
---

Add the optional `sections` option to `createSearchController`: extra indices (`collections`, …) searched in the same request as the products, on their first page, exposed under `state.sections` keyed by index. Pass a function to resolve the sections per request.
