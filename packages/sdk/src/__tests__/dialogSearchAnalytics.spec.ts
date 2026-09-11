import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { EventsHandler } from "../EventsHandler";
import { DIALOG_CUSTOM_EVENT, DialogEvents } from "../types/events";
import { SearchAnalyticsEnvelope } from "../types/searchAnalytics";

// Bypass constructor DOM setup; provide only the fields used by analytics.
const buildDialog = (): {
  dialog: Dialog;
  emitExternalEvent: ReturnType<typeof vi.fn>;
} => {
  const eventsHandler = new EventsHandler("fr", "user-1");
  const emitExternalEvent = vi.fn();
  eventsHandler.emitExternalEvent =
    emitExternalEvent as EventsHandler["emitExternalEvent"];

  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _eventsHandler: eventsHandler,
    _userId: "user-1",
  });

  return { dialog, emitExternalEvent };
};

const envelope: SearchAnalyticsEnvelope = {
  query_id: "query-1",
  index: "products_fr_eur",
  surface: "search_page",
  search_type: "lexical",
  page: 2,
  total_hits: 1247,
  query_length: 14,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Dialog search analytics", () => {
  it("emits TRACK_VIEW_SEARCH_RESULTS with the snake_case envelope, items and userId", () => {
    const { dialog, emitExternalEvent } = buildDialog();
    const items = [
      { product_id: "product-1", position: 21 },
      { product_id: "product-2", position: 22 },
    ];

    dialog.trackViewSearchResults({ ...envelope, items });

    expect(emitExternalEvent).toHaveBeenCalledWith(
      DialogEvents.TRACK_VIEW_SEARCH_RESULTS,
      { userId: "user-1", ...envelope, items },
    );
  });

  it("represents a rendered no-results state as empty items with total_hits 0", () => {
    const { dialog, emitExternalEvent } = buildDialog();

    dialog.trackViewSearchResults({ ...envelope, total_hits: 0, items: [] });

    expect(emitExternalEvent).toHaveBeenCalledWith(
      DialogEvents.TRACK_VIEW_SEARCH_RESULTS,
      { userId: "user-1", ...envelope, total_hits: 0, items: [] },
    );
  });

  it("emits TRACK_SELECT_SEARCH_RESULT with a single-item array", () => {
    const { dialog, emitExternalEvent } = buildDialog();
    const item = { product_id: "product-1", position: 22 };

    dialog.trackSelectSearchResult({ ...envelope, items: [item] });

    expect(emitExternalEvent).toHaveBeenCalledWith(
      DialogEvents.TRACK_SELECT_SEARCH_RESULT,
      { userId: "user-1", ...envelope, items: [item] },
    );
  });
});

describe("EventsHandler search event buffering", () => {
  it("buffers both search events until consumer-ready, then flushes them intact and in order", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    const eventsHandler = new EventsHandler("fr", "user-1");
    const item = { product_id: "product-1", position: 22 };

    eventsHandler.emitExternalEvent(DialogEvents.TRACK_VIEW_SEARCH_RESULTS, {
      ...envelope,
      items: [],
    });
    eventsHandler.emitExternalEvent(DialogEvents.TRACK_SELECT_SEARCH_RESULT, {
      ...envelope,
      items: [item],
    });
    expect(dispatchEvent).not.toHaveBeenCalled();

    eventsHandler.notifyConsumerReady();

    const dispatched = dispatchEvent.mock.calls.map(([event]) => ({
      name: (event as CustomEvent).type,
      detail: (event as CustomEvent).detail as unknown,
    }));
    expect(dispatched).toEqual([
      {
        name: DIALOG_CUSTOM_EVENT,
        detail: {
          type: DialogEvents.TRACK_VIEW_SEARCH_RESULTS,
          payload: { ...envelope, items: [] },
        },
      },
      {
        name: DIALOG_CUSTOM_EVENT,
        detail: {
          type: DialogEvents.TRACK_SELECT_SEARCH_RESULT,
          payload: { ...envelope, items: [item] },
        },
      },
    ]);
  });
});
