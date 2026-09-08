// This controller is one cohesive unit: `selectResult` reports whether the
// navigate adapter handled the transition and the response is split into the
// products entry plus its sections, pushing the file past the default 200-line
// cap — raised modestly rather than split artificially.
/* eslint max-lines: ["error", 240] */
import { searchIndexName } from "./services/search";
import { SearchRequest, SearchResult } from "./types/search";
import {
  SearchController,
  SearchControllerOptions,
  SearchControllerState,
  SearchSection,
  SearchStatus,
} from "./types/searchController";
import { createControllerAnalytics } from "./utils/searchControllerAnalytics";
import {
  buildSectionQueries,
  pickSectionResults,
} from "./utils/searchSections";

const DEFAULT_DEBOUNCE_MS = 250;
const DEFAULT_HITS_PER_PAGE = 12;
// `SearchRequest` rejects queries under two visible characters (code points).
const MIN_QUERY_CODE_POINTS = 2;

const INITIAL_STATE: SearchControllerState = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
  response: undefined,
  sections: undefined,
  error: undefined,
};

export function createSearchController({
  search,
  analytics,
  navigate,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  hitsPerPage = DEFAULT_HITS_PER_PAGE,
  locale,
  sections = [],
}: SearchControllerOptions): SearchController {
  const indexName = searchIndexName("products", locale);
  const resolveSections = (): readonly SearchSection[] =>
    typeof sections === "function" ? sections() : sections;
  let state = INITIAL_STATE;
  const listeners = new Set<(next: SearchControllerState) => void>();
  const controllerAnalytics = createControllerAnalytics(analytics);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  // Query typed but not yet run: `state.query` only holds committed queries, so
  // without this, `setPage()` would cancel the debounce and paginate stale results.
  let pendingQuery: string | undefined;
  let abortController: AbortController | undefined;
  // Monotonic token: a response only lands if it belongs to the latest request.
  let requestId = 0;
  let disposed = false;

  const setState = (patch: Partial<SearchControllerState>): void => {
    state = { ...state, ...patch };
    for (const listener of listeners) {
      listener(state);
    }
  };

  const cancelInFlight = (): void => {
    clearTimeout(debounceTimer);
    abortController?.abort();
    abortController = undefined;
  };

  const buildRequest = (
    query: string,
    page: number,
    requested: readonly SearchSection[],
  ): SearchRequest => ({
    requests: [
      { indexName, query, page, hitsPerPage },
      ...buildSectionQueries(requested, query, locale, hitsPerPage),
    ],
  });

  const run = async (query: string, page: number): Promise<void> => {
    cancelInFlight();
    abortController = new AbortController();
    const id = ++requestId;

    setState({ status: SearchStatus.LOADING, query, page });
    try {
      const requested = resolveSections();
      const response = await search(buildRequest(query, page, requested), {
        signal: abortController.signal,
      });
      if (id !== requestId) {
        return; // A newer request landed first: this response is stale.
      }
      const result: SearchResult | undefined = response.results.find(
        (entry) => entry.index === indexName,
      );
      if (result === undefined) {
        throw new Error(`Dialog search returned no ${indexName} entry`);
      }
      controllerAnalytics.onResponse(result);
      setState({
        status: result.nbHits === 0 ? SearchStatus.EMPTY : SearchStatus.SUCCESS,
        response: result,
        sections: pickSectionResults(response, requested, locale),
        error: undefined,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // Superseded by a newer request — never surfaced.
      }
      if (id !== requestId) {
        return;
      }
      setState({
        status: SearchStatus.ERROR,
        error,
        response: undefined,
        sections: undefined,
      });
    }
  };

  // Shared by `setQuery`/`submit`: undefined = reset to idle (query too short).
  const prepare = (rawQuery: string): string | undefined => {
    const query = rawQuery.trim();
    cancelInFlight();
    pendingQuery = undefined;
    if ([...query].length < MIN_QUERY_CODE_POINTS) {
      requestId += 1; // Invalidate anything in flight.
      setState(INITIAL_STATE);

      return undefined;
    }

    return query;
  };

  return {
    setQuery(rawQuery) {
      const query = disposed ? undefined : prepare(rawQuery);
      if (query === undefined) {
        return;
      }
      pendingQuery = query;
      debounceTimer = setTimeout(() => {
        pendingQuery = undefined;
        void run(query, 0);
      }, debounceMs);
    },

    submit(rawQuery) {
      const query = disposed ? undefined : prepare(rawQuery);
      if (query === undefined) {
        return;
      }
      void run(query, 0);
    },

    setPage(page) {
      if (disposed) {
        return;
      }
      if (pendingQuery !== undefined) {
        // A query change is pending: the click targeted stale results, so the
        // new query supersedes pagination — flush it now instead of debouncing.
        const query = pendingQuery;
        pendingQuery = undefined;
        void run(query, 0);

        return;
      }
      if (state.query === "") {
        return; // Pagination requires a committed non-empty query.
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
      cancelInFlight();
      requestId += 1;
      pendingQuery = undefined;
      listeners.clear();
      controllerAnalytics.dispose();
    },
  };
}
