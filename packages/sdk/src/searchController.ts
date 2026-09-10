import { searchIndexName } from "./services/search";
import {
  SearchController,
  SearchControllerOptions,
  SearchControllerState,
  SearchStatus,
} from "./types/searchController";
import { createControllerAnalytics } from "./utils/searchControllerAnalytics";
import {
  buildSearchRequest,
  normalizeQuery,
  readSearchResults,
} from "./utils/searchRequests";

const INITIAL_STATE: SearchControllerState = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
  response: undefined,
  additionalResults: undefined,
  error: undefined,
};

export function createSearchController({
  client,
  language,
  currency,
  analytics,
  navigate,
  debounceMs = 250,
  hitsPerPage = 12,
  additionalIndexes: indexes = [],
}: SearchControllerOptions): SearchController {
  const requestConfig = {
    indexName: searchIndexName("products", language, currency),
    language,
    currency,
    hitsPerPage,
  };
  let state = INITIAL_STATE;
  const listeners = new Set<(next: SearchControllerState) => void>();
  const controllerAnalytics = createControllerAnalytics(analytics);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingQuery: string | undefined;
  let abortController: AbortController | undefined;
  let requestId = 0;
  let disposed = false;

  const setState = (patch: Partial<SearchControllerState>): void => {
    state = { ...state, ...patch };
    for (const listener of listeners) {
      listener(state);
    }
  };

  const cancelPendingSearch = (): void => {
    clearTimeout(debounceTimer);
    pendingQuery = undefined;
    requestId += 1;
    abortController?.abort();
    abortController = undefined;
  };

  const run = async (query: string, page: number): Promise<void> => {
    cancelPendingSearch();
    abortController = new AbortController();
    const id = requestId;

    setState({ status: SearchStatus.LOADING, query, page });
    try {
      const requested = typeof indexes === "function" ? indexes() : indexes;
      const request = buildSearchRequest(query, page, requested, requestConfig);
      const response = await client.search(request, {
        signal: abortController.signal,
      });
      if (id !== requestId) {
        return; // Ignore a superseded request.
      }
      const results = readSearchResults(response, requested, requestConfig);
      controllerAnalytics.onResponse(results.response);
      setState({
        ...results,
        status:
          results.response.nbHits === 0
            ? SearchStatus.EMPTY
            : SearchStatus.SUCCESS,
        error: undefined,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // Cancellation is not a search error.
      }
      if (id !== requestId) {
        return;
      }
      setState({
        status: SearchStatus.ERROR,
        error,
        response: undefined,
        additionalResults: undefined,
      });
    }
  };

  return {
    setQuery(rawQuery) {
      if (disposed) {
        return;
      }
      cancelPendingSearch();
      const query = normalizeQuery(rawQuery);
      if (query === undefined) {
        setState(INITIAL_STATE);

        return;
      }
      pendingQuery = query;
      debounceTimer = setTimeout(() => void run(query, 0), debounceMs);
    },

    submit(rawQuery) {
      if (disposed) {
        return;
      }
      cancelPendingSearch();
      const query = normalizeQuery(rawQuery);
      if (query === undefined) {
        setState(INITIAL_STATE);

        return;
      }
      void run(query, 0);
    },

    setPage(page) {
      if (disposed) {
        return;
      }
      if (pendingQuery !== undefined) {
        // Submit pending input on page zero before allowing pagination.
        void run(pendingQuery, 0);

        return;
      }
      if (state.query === "") {
        return; // No query to paginate.
      }
      void run(state.query, page);
    },

    retry() {
      if (disposed || state.status !== SearchStatus.ERROR) {
        return;
      }
      void run(state.query, state.page);
    },

    observeResult(element, index) {
      if (state.response === undefined) {
        return;
      }
      controllerAnalytics.observeResult(element, state.response, index);
    },

    selectResult(index, options) {
      const response = state.response;
      if (response === undefined) {
        return false;
      }
      controllerAnalytics.select(response, index);
      const url = response.hits[index].url;
      const runAdapter = options?.navigate ?? true;
      if (runAdapter && navigate !== undefined && url !== undefined) {
        navigate(url, response.hits[index]);

        return true;
      }

      return false;
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    getState: () => state,

    dispose() {
      disposed = true;
      cancelPendingSearch();
      listeners.clear();
      controllerAnalytics.dispose();
    },
  };
}
