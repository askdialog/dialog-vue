/** Supported indices before adding language and currency. */
export const SEARCH_INDICES = [
  "products",
  "collections",
  "articles",
  "pages",
] as const;

export type SearchIndex = (typeof SEARCH_INDICES)[number];

export interface SearchQuery {
  /**
   * `<index>_<lang>_<currency>`, e.g. `products_fr_eur`.
   * Use the same language and lowercase ISO 4217 currency for every entry.
   * Unsupported index names return 404.
   */
  indexName: string;
  /** At least two code points after server-side trimming. */
  query: string;
  /** Zero-based page; server default: 0. */
  page?: number;
  /** Page size from 1 to 100; server default: 20. */
  hitsPerPage?: number;
}

export interface SearchRequest {
  requests: SearchQuery[];
}

export interface SearchOptions {
  /** Passed to fetch; cancellation rejects with `AbortError`. */
  signal?: AbortSignal;
}

export interface SearchPrice {
  /** Decimal string, e.g. "24.90". */
  amount: string;
  /** Currency code, if provided by the index. */
  currencyCode?: string;
}

export interface SearchPriceRange {
  min: SearchPrice;
  max: SearchPrice;
}

/** Indexed record. Display fields are optional; only products have `priceRange`. */
export interface SearchHit {
  objectID: string;
  title?: string;
  url?: string;
  handle?: string;
  imageUrl?: string;
  priceRange?: SearchPriceRange;
}

export interface SearchResult {
  index: string;
  hits: SearchHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  queryID: string;
}

/** Results in request order. */
export interface SearchResponse {
  results: SearchResult[];
}
