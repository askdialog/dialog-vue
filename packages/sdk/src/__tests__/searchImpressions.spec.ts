/* eslint max-lines: ["error", 300] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchImpressionTracker } from "../utils/searchImpressions";
import { SearchAnalyticsEnvelope } from "../types/searchAnalytics";

const envelope: SearchAnalyticsEnvelope = {
  query_id: "query-1",
  index: "products_fr_eur",
  surface: "search_page",
  search_type: "lexical",
  page: 1,
  total_hits: 42,
  query_length: 6,
};

type ObserverCallback = (
  entries: Array<Partial<IntersectionObserverEntry>>,
) => void;

let observerCallback: ObserverCallback;
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();
const windowListeners = new Map<string, (event: unknown) => void>();

const element = (): Element => ({}) as Element;

const intersect = (target: Element, ratio: number): void => {
  observerCallback([{ target, intersectionRatio: ratio }]);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    },
  );
  vi.stubGlobal("window", {
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      windowListeners.set(type, listener);
    },
    removeEventListener: (type: string) => {
      windowListeners.delete(type);
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  windowListeners.clear();
});

describe("createSearchImpressionTracker", () => {
  it("emits a batched impression after dwell then scroll inactivity", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });

    intersect(card, 0.6);
    vi.advanceTimersByTime(500);
    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(emit).toHaveBeenCalledWith({
      ...envelope,
      items: [{ product_id: "product-1", position: 1 }],
    });
  });

  it("does not count an item that leaves the viewport before the dwell time", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });

    intersect(card, 0.6);
    vi.advanceTimersByTime(300);
    intersect(card, 0.2);
    vi.advanceTimersByTime(5000);

    expect(emit).not.toHaveBeenCalled();
  });

  it("never re-counts a (query_id, product_id) pair", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });

    intersect(card, 0.6);
    vi.advanceTimersByTime(2000);
    intersect(card, 0.1);
    intersect(card, 0.6);
    vi.advanceTimersByTime(5000);

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("flushes immediately when the batch reaches the item cap", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({
      emit,
      maxItemsPerEvent: 2,
    });
    tracker.setContext(envelope);
    const first = element();
    const second = element();
    tracker.observe(first, { product_id: "product-1", position: 1 });
    tracker.observe(second, { product_id: "product-2", position: 2 });

    intersect(first, 0.6);
    intersect(second, 0.6);
    vi.advanceTimersByTime(500);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0][0].items).toHaveLength(2);
  });

  it("flushes pending impressions under their own envelope when the context changes", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(500);

    tracker.setContext({ ...envelope, query_id: "query-2", page: 1 });

    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ query_id: "query-1" }),
    );
  });

  it("forces the clicked item's impression and flushes immediately", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);

    tracker.forceImpression({ product_id: "product-1", position: 1 });

    expect(emit).toHaveBeenCalledWith({
      ...envelope,
      items: [{ product_id: "product-1", position: 1 }],
    });
  });

  it("does not duplicate a forced impression already counted", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(2000);

    tracker.forceImpression({ product_id: "product-1", position: 1 });

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("restarts deduplication on every context change: each response mints a fresh query_id", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(2000);

    tracker.setContext({ ...envelope, query_id: "query-2", page: 2 });
    const cardOnPage2 = element();
    tracker.observe(cardOnPage2, { product_id: "product-1", position: 1 });
    intersect(cardOnPage2, 0.6);
    vi.advanceTimersByTime(2000);

    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("flushes qualified impressions on pagehide", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(500);

    windowListeners.get("pagehide")?.({});

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("re-qualifies items after a back/forward-cache restore", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(2000);
    expect(emit).toHaveBeenCalledTimes(1);

    windowListeners.get("pageshow")?.({ persisted: true });
    intersect(card, 0.6);
    vi.advanceTimersByTime(2000);

    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("requires a full fresh dwell after a back/forward-cache restore", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);
    const card = element();
    tracker.observe(card, { product_id: "product-1", position: 1 });
    intersect(card, 0.6);
    vi.advanceTimersByTime(300);

    windowListeners.get("pageshow")?.({ persisted: true });
    intersect(card, 0.6);

    // Fresh dwell: record at 500ms and flush at 2000ms, not at 200ms and 1700ms.
    vi.advanceTimersByTime(1700);
    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("emits nothing when no impression qualified", () => {
    const emit = vi.fn();
    const tracker = createSearchImpressionTracker({ emit });
    tracker.setContext(envelope);

    tracker.flush();
    windowListeners.get("pagehide")?.({});

    expect(emit).not.toHaveBeenCalled();
  });
});
