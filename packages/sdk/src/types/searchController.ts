import type { Dialog } from "../Dialog";
import {
  SearchHit,
  SearchIndex,
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "./search";
import {
  SearchSurface,
  SelectSearchResultParams,
  ViewSearchResultsParams,
} from "./searchAnalytics";

export const SearchStatus = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  /** Successful request with zero hits. */
  EMPTY: "empty",
  ERROR: "error",
} as const;

export type SearchStatus = (typeof SearchStatus)[keyof typeof SearchStatus];

export interface SearchSection {
  index: Exclude<SearchIndex, "products">;
  hitsPerPage?: number;
}

export interface SearchControllerState {
  status: SearchStatus;
  /** Last submitted query, excluding pending input. */
  query: string;
  /** Zero-based page of the last request. */
  page: number;
  /** Last products result; retained while loading and cleared on error or reset. */
  response?: SearchResult;
  sections?: Partial<Record<SearchIndex, SearchResult>>;
  error?: unknown;
}

export type SearchFunction = (
  request: SearchRequest,
  options?: SearchOptions,
) => Promise<SearchResponse>;

/** Event callbacks; the controller handles impression batching and deduplication. */
export interface SearchControllerAnalytics {
  surface: SearchSurface;
  trackViewSearchResults: (params: ViewSearchResultsParams) => void;
  trackSelectSearchResult: (params: SelectSearchResultParams) => void;
}

export interface SearchControllerOptions {
  client: Pick<Dialog, "search">;
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  language: string;
  /** ISO 4217 currency, independent of language. */
  currency: string;
  analytics: SearchControllerAnalytics;
  /** Navigate after recording selection. Omit to use native link navigation. */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
  sections?: readonly SearchSection[] | (() => readonly SearchSection[]);
}

/** Manage search requests, pagination and analytics independently of rendering. */
export interface SearchController {
  /** Submit after the debounce delay. */
  setQuery(rawQuery: string): void;
  /** Submit immediately. */
  submit(rawQuery: string): void;
  /** Request a zero-based page immediately. Pending input starts at page zero. */
  setPage(page: number): void;
  /** Retry the last request when the state is `error`. */
  retry(): void;
  /** Track impressions for the element representing `response.hits[index]`. */
  observeResult(element: Element, index: number): void;
  /**
   * Record the impression and selection for `response.hits[index]`.
   * Pass `{ navigate: false }` for middle-clicks or modified clicks.
   * Returns true if the navigation adapter ran; call `preventDefault()` then.
   */
  selectResult(index: number, options?: { navigate?: boolean }): boolean;
  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(listener: (state: SearchControllerState) => void): () => void;
  getState(): SearchControllerState;
  /** Cancel pending requests and remove listeners and observers. */
  dispose(): void;
}
