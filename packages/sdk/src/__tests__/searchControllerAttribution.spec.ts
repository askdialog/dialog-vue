/* eslint max-lines: ["error", 300] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../searchController";
import { SearchResponse, SearchResult } from "../types/search";
import { SearchController } from "../types/searchController";

const tracker = vi.hoisted(() => ({
  setContext: vi.fn(),
  observe: vi.fn(),
  forceImpression: vi.fn(),
  flush: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => tracker,
}));

const response = (overrides: Partial<SearchResult> = {}): SearchResponse => ({
  results: [
    {
      index: "products_fr_eur",
      hits: [
        { objectID: "p1", url: "https://shop.example/p1" },
        { objectID: "p2" },
      ],
      nbHits: 30,
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

const search = vi.fn();
const trackViewSearchResults = vi.fn();
const trackSelectSearchResult = vi.fn();
const navigate = vi.fn();

const createController = (): SearchController =>
  createSearchController({
    client: { search },
    language: "fr",
    currency: "EUR",
    analytics: {
      surface: "search_page",
      trackViewSearchResults,
      trackSelectSearchResult,
    },
    navigate,
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("search controller attribution", () => {
  it("never resends a query id: each request is its own query", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.setPage(1);
    await settle();

    for (const [request] of search.mock.calls) {
      expect(request.requests[0]).not.toHaveProperty("queryId");
      expect(request.requests[0]).not.toHaveProperty("queryID");
    }
  });

  it("declares the rendered result's envelope to the impression tracker", async () => {
    const controller = createController();
    search.mockResolvedValue(response({ page: 1, query: "shoes" }));

    controller.submit("shoes");
    await settle();

    expect(tracker.setContext).toHaveBeenCalledWith({
      query_id: "qid-1",
      index: "products_fr_eur",
      surface: "search_page",
      search_type: "lexical",
      page: 2,
      total_hits: 30,
      query_length: 5,
    });
  });

  it("follows the response's queryID: every page is its own query", async () => {
    const controller = createController();
    search
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response({ page: 1, queryID: "qid-2" }))
      .mockResolvedValueOnce(response({ query: "boots", queryID: "qid-3" }));

    controller.submit("shoes");
    await settle();
    controller.setPage(1);
    await settle();
    controller.submit("boots");
    await settle();

    const queryIds = tracker.setContext.mock.calls.map(
      ([envelope]) => envelope.query_id,
    );
    expect(queryIds).toEqual(["qid-1", "qid-2", "qid-3"]);
  });

  it("emits the zero-items view event for a rendered no-results state", async () => {
    const controller = createController();
    search.mockResolvedValue(
      response({ hits: [], nbHits: 0, nbPages: 0, query: "nothing" }),
    );

    controller.submit("nothing");
    await settle();

    expect(trackViewSearchResults).toHaveBeenCalledWith({
      query_id: "qid-1",
      index: "products_fr_eur",
      surface: "search_page",
      search_type: "lexical",
      page: 1,
      total_hits: 0,
      query_length: 7,
      items: [],
    });
  });

  it("observes result elements with absolute 1-based positions", async () => {
    const controller = createController();
    search.mockResolvedValue(response({ page: 2 }));
    const element = {} as Element;

    controller.submit("shoes");
    await settle();
    controller.observeResult(element, 1);

    expect(tracker.observe).toHaveBeenCalledWith(element, {
      product_id: "p2",
      position: 2 * 12 + 2,
    });
  });

  it("ignores observe and select before any response", () => {
    const controller = createController();

    controller.observeResult({} as Element, 0);
    controller.selectResult(0);

    expect(tracker.observe).not.toHaveBeenCalled();
    expect(trackSelectSearchResult).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("records selection attribution before handing navigation to the adapter", async () => {
    const controller = createController();
    const landed = response();
    search.mockResolvedValue(landed);
    const order: string[] = [];
    tracker.forceImpression.mockImplementation(() => order.push("impression"));
    trackSelectSearchResult.mockImplementation(() => order.push("select"));
    navigate.mockImplementation(() => order.push("navigate"));

    controller.submit("shoes");
    await settle();
    controller.selectResult(0);

    expect(tracker.forceImpression).toHaveBeenCalledWith({
      product_id: "p1",
      position: 1,
    });
    expect(trackSelectSearchResult).toHaveBeenCalledWith({
      query_id: "qid-1",
      index: "products_fr_eur",
      surface: "search_page",
      search_type: "lexical",
      page: 1,
      total_hits: 30,
      query_length: 5,
      items: [{ product_id: "p1", position: 1 }],
    });
    expect(navigate).toHaveBeenCalledWith(
      "https://shop.example/p1",
      landed.results[0].hits[0],
    );
    expect(order).toEqual(["impression", "select", "navigate"]);
  });

  it("still records attribution when the hit has no URL to navigate to", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.selectResult(1);

    expect(trackSelectSearchResult).toHaveBeenCalledWith(
      expect.objectContaining({ items: [{ product_id: "p2", position: 2 }] }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns true when the navigate adapter handles the transition", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();

    expect(controller.selectResult(0)).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("returns false when the selected hit has no URL", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();

    expect(controller.selectResult(1)).toBe(false);
  });

  it("returns false before any response", () => {
    expect(createController().selectResult(0)).toBe(false);
  });

  it("records attribution but skips the adapter when navigation is opted out", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();

    expect(controller.selectResult(0, { navigate: false })).toBe(false);
    expect(trackSelectSearchResult).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns false when no navigate adapter is configured", async () => {
    const controller = createSearchController({
      client: { search },
      language: "fr",
      currency: "EUR",
      analytics: {
        surface: "search_page",
        trackViewSearchResults,
        trackSelectSearchResult,
      },
    });
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();

    expect(controller.selectResult(0)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("disconnects the impression tracker on dispose", async () => {
    const controller = createController();
    search.mockResolvedValue(response());

    controller.submit("shoes");
    await settle();
    controller.dispose();

    expect(tracker.disconnect).toHaveBeenCalledTimes(1);
  });
});
