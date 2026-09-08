/* eslint max-lines: ["error", 460] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../searchController";
import {
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchControllerState, SearchStatus } from "../types/searchController";

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => ({
    setContext: vi.fn(),
    observe: vi.fn(),
    forceImpression: vi.fn(),
    flush: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const DEBOUNCE_MS = 250;

const response = (overrides: Partial<SearchResult> = {}): SearchResponse => ({
  results: [
    {
      index: "products_fr",
      hits: [{ objectID: "p1" }, { objectID: "p2" }],
      nbHits: 2,
      page: 0,
      nbPages: 3,
      hitsPerPage: 12,
      processingTimeMS: 5,
      query: "shoes",
      queryID: "qid-1",
      ...overrides,
    },
  ],
});

interface Deferred {
  promise: Promise<SearchResponse>;
  resolve: (value: SearchResponse) => void;
  reject: (error: unknown) => void;
}

const deferred = (): Deferred => {
  let resolve!: (value: SearchResponse) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<SearchResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// Lets the controller's `await search(...)` continuation run.
const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const search =
  vi.fn<
    (req: SearchRequest, opts?: SearchOptions) => Promise<SearchResponse>
  >();
const trackViewSearchResults = vi.fn();
const trackSelectSearchResult = vi.fn();
const states: SearchControllerState[] = [];

const createController = (): ReturnType<typeof createSearchController> => {
  const controller = createSearchController({
    search,
    analytics: {
      surface: "search_page",
      trackViewSearchResults,
      trackSelectSearchResult,
    },
    locale: "fr",
  });
  controller.subscribe((state) => states.push(state));

  return controller;
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  states.length = 0;
});

describe("createSearchController", () => {
  it("starts idle", () => {
    const controller = createController();

    expect(controller.getState()).toMatchObject({
      status: SearchStatus.IDLE,
      query: "",
      page: 0,
    });
  });

  it("debounces rapid input into a single request for the last query", async () => {
    const controller = createController();
    search.mockResolvedValue(response({ query: "shoes" }));

    controller.setQuery("sh");
    vi.advanceTimersByTime(DEBOUNCE_MS - 1);
    controller.setQuery("sho");
    vi.advanceTimersByTime(DEBOUNCE_MS - 1);
    controller.setQuery("shoes");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0].requests[0]).toMatchObject({
      query: "shoes",
      page: 0,
    });
    expect(controller.getState().status).toBe(SearchStatus.SUCCESS);
  });

  it("sends one products entry named after the bare-language locale", async () => {
    const controller = createSearchController({
      search,
      analytics: {
        surface: "search_page",
        trackViewSearchResults,
        trackSelectSearchResult,
      },
      locale: "fr-FR",
    });
    search.mockResolvedValue(response({ query: "shoes" }));

    controller.submit("shoes");
    await settle();

    expect(search.mock.calls[0][0]).toEqual({
      requests: [
        { indexName: "products_fr", query: "shoes", page: 0, hitsPerPage: 12 },
      ],
    });
    controller.dispose();
  });

  it("submits immediately without waiting for the debounce", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.setQuery("sho");
    controller.submit("shoes");
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0].requests[0]).toMatchObject({
      query: "shoes",
    });
    expect(controller.getState().status).toBe(SearchStatus.SUCCESS);
  });

  it("aborts the previous in-flight request when a new one starts", async () => {
    const controller = createController();
    const first = deferred();
    const second = deferred();
    search
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    controller.submit("shoes");
    const firstSignal = search.mock.calls[0][1]?.signal;
    controller.submit("boots");

    expect(firstSignal?.aborted).toBe(true);

    second.resolve(response({ query: "boots", queryID: "qid-2" }));
    await settle();

    expect(controller.getState().response?.query).toBe("boots");
  });

  it("never lets a late stale response replace newer results, even without transport cancellation", async () => {
    const controller = createController();
    const stale = deferred();
    const fresh = deferred();
    search
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise);

    controller.submit("shoes");
    controller.submit("boots");
    fresh.resolve(response({ query: "boots", queryID: "qid-2" }));
    await settle();
    // The stale transport ignored the abort and answers after the fresh one.
    stale.resolve(response({ query: "shoes", queryID: "qid-1" }));
    await settle();

    expect(controller.getState().status).toBe(SearchStatus.SUCCESS);
    expect(controller.getState().response?.query).toBe("boots");
  });

  it("swallows the AbortError of a superseded request", async () => {
    const controller = createController();
    const first = deferred();
    search
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(response({ query: "boots", queryID: "qid-2" }));

    controller.submit("shoes");
    controller.submit("boots");
    first.reject(new DOMException("The operation was aborted.", "AbortError"));
    await settle();

    expect(controller.getState().status).toBe(SearchStatus.SUCCESS);
    expect(controller.getState().error).toBeUndefined();
  });

  it("surfaces errors and retries the same query and page", async () => {
    const controller = createController();
    const failure = new TypeError("Failed to fetch");
    search
      .mockResolvedValueOnce(response())
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(response({ page: 2 }));

    controller.submit("shoes");
    await settle();
    controller.setPage(2);
    await settle();

    expect(controller.getState()).toMatchObject({
      status: SearchStatus.ERROR,
      error: failure,
      response: undefined,
    });

    controller.retry();
    await settle();

    expect(search).toHaveBeenCalledTimes(3);
    expect(search.mock.calls[2][0].requests[0]).toMatchObject({
      query: "shoes",
      page: 2,
    });
    expect(controller.getState().status).toBe(SearchStatus.SUCCESS);
  });

  it("ignores retry outside the error state", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.retry();
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
  });

  it("reports the empty status on zero hits", async () => {
    const controller = createController();
    search.mockResolvedValue(response({ hits: [], nbHits: 0, nbPages: 0 }));

    controller.submit("shoes");
    await settle();

    expect(controller.getState().status).toBe(SearchStatus.EMPTY);
  });

  it("resets to idle and invalidates in-flight work when the query gets too short", async () => {
    const controller = createController();
    const inFlight = deferred();
    search.mockReturnValueOnce(inFlight.promise);

    controller.submit("shoes");
    controller.setQuery("s");
    inFlight.resolve(response());
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.getState().status).toBe(SearchStatus.IDLE);
  });

  it("resets pagination when a new query is submitted", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.setPage(2);
    await settle();
    controller.submit("boots");
    await settle();

    expect(search.mock.calls[2][0].requests[0]).toMatchObject({
      query: "boots",
      page: 0,
    });
  });

  it("flushes a pending debounced query instead of paginating stale results", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.setQuery("boots");
    controller.setPage(1);
    await settle();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1][0].requests[0]).toMatchObject({
      query: "boots",
      page: 0,
    });
  });

  it("ignores pagination without a committed query", () => {
    const controller = createController();

    controller.setPage(1);

    expect(search).not.toHaveBeenCalled();
  });

  it("notifies subscribers and stops after unsubscribe", async () => {
    const controller = createController();
    search.mockResolvedValue(response());
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    controller.submit("shoes");
    await settle();
    const notified = listener.mock.calls.length;
    unsubscribe();
    controller.submit("boots");
    await settle();

    expect(notified).toBeGreaterThan(0);
    expect(listener).toHaveBeenCalledTimes(notified);
  });

  it("stops all work after dispose", async () => {
    const controller = createController();
    const inFlight = deferred();
    search.mockReturnValueOnce(inFlight.promise);

    controller.submit("shoes");
    const signal = search.mock.calls[0][1]?.signal;
    controller.dispose();

    expect(signal?.aborted).toBe(true);

    inFlight.resolve(response());
    await settle();
    controller.setQuery("boots");
    controller.submit("boots");
    controller.setPage(1);
    controller.retry();
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await settle();

    expect(search).toHaveBeenCalledTimes(1);
    expect(controller.getState().status).toBe(SearchStatus.LOADING);
  });
  it("requests the sections on their first page with the products and exposes their entries", async () => {
    const controller = createSearchController({
      search,
      analytics: {
        surface: "search_page",
        trackViewSearchResults,
        trackSelectSearchResult,
      },
      locale: "fr",
      sections: [{ index: "collections", hitsPerPage: 5 }],
    });
    const collections: SearchResult = {
      ...response().results[0],
      index: "collections_fr",
      hits: [{ objectID: "c1" }],
      nbHits: 1,
    };
    search.mockResolvedValueOnce({
      results: [...response().results, collections],
    });

    controller.submit("shoes");
    await settle();

    expect(search.mock.calls[0][0].requests).toEqual([
      { indexName: "products_fr", query: "shoes", page: 0, hitsPerPage: 12 },
      { indexName: "collections_fr", query: "shoes", page: 0, hitsPerPage: 5 },
    ]);
    expect(controller.getState().response?.index).toBe("products_fr");
    expect(controller.getState().sections).toEqual({ collections });
  });

  it("resolves a sections function per request and leaves a missing entry out", async () => {
    let enabled = false;
    const controller = createSearchController({
      search,
      analytics: {
        surface: "search_page",
        trackViewSearchResults,
        trackSelectSearchResult,
      },
      locale: "fr",
      sections: () => (enabled ? [{ index: "collections" }] : []),
    });
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    enabled = true;
    controller.submit("boots");
    await settle();

    expect(search.mock.calls[0][0].requests).toHaveLength(1);
    expect(search.mock.calls[1][0].requests).toHaveLength(2);
    expect(search.mock.calls[1][0].requests[1]).toMatchObject({
      indexName: "collections_fr",
      hitsPerPage: 12,
    });
    expect(controller.getState().sections).toEqual({});
  });

  it("enters the error state when the sections resolver throws", async () => {
    const failure = new Error("entitlement lookup failed");
    const controller = createSearchController({
      search,
      analytics: {
        surface: "search_page",
        trackViewSearchResults,
        trackSelectSearchResult,
      },
      locale: "fr",
      sections: () => {
        throw failure;
      },
    });

    controller.submit("shoes");
    await settle();

    expect(search).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      status: SearchStatus.ERROR,
      error: failure,
      response: undefined,
      sections: undefined,
    });
  });
});
