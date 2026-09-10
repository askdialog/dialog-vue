import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DialogSearchError } from "../DialogSearchError";
import { searchIndexName, searchLexical } from "../services/search";
import { SearchRequest, SearchResponse } from "../types/search";

const API_KEY = "pk_test_abcdef";

const request: SearchRequest = {
  requests: [
    {
      indexName: "products_fr_eur",
      query: "running shoes",
      page: 2,
      hitsPerPage: 50,
    },
  ],
};

const emptyResponse: SearchResponse = {
  results: [
    {
      index: "products_fr_eur",
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage: 20,
      processingTimeMS: 3,
      query: "running shoes",
      queryID: "0198c3f2-0000-7000-8000-000000000000",
    },
  ],
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("searchIndexName", () => {
  it.each([
    ["fr", "EUR", "products_fr_eur"],
    ["pt", "BRL", "products_pt_brl"],
    ["fr", "CAD", "products_fr_cad"],
    ["en", "EUR", "products_en_eur"],
  ])(
    "builds an index name from language %s and currency",
    (locale, currency, name) => {
      expect(searchIndexName("products", locale, currency)).toBe(name);
    },
  );

  it("names every logical index", () => {
    expect(searchIndexName("collections", "en", "USD")).toBe(
      "collections_en_usd",
    );
    expect(() => searchIndexName("products", "fr-FR", "EUR")).toThrow(
      /ISO 639-1/,
    );
    expect(() => searchIndexName("products", "fr", "")).toThrow(/ISO 4217/);
  });
});

describe("searchLexical", () => {
  it("POSTs the exact request to /public/search/lexical with only the api key header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await searchLexical(API_KEY, request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/public\/search\/lexical$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "x-dialog-api-key": API_KEY,
    });
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("keeps optional per-entry fields the caller did not provide off the wire", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await searchLexical(API_KEY, {
      requests: [{ indexName: "products_fr_eur", query: "running shoes" }],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      requests: [{ indexName: "products_fr_eur", query: "running shoes" }],
    });
  });

  it("resolves the typed response, including empty results", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await expect(searchLexical(API_KEY, request)).resolves.toEqual(
      emptyResponse,
    );
  });

  it.each([
    [404, "Index products_xx does not exist"],
    [400, "Unknown parameter: foo"],
  ])(
    "rejects the Algolia-shaped %i error body with a DialogSearchError",
    async (status, message) => {
      fetchMock.mockResolvedValue(jsonResponse({ message, status }, status));

      const error = await searchLexical(API_KEY, request).catch(
        (caught: unknown) => caught as DialogSearchError,
      );

      expect(error).toBeInstanceOf(DialogSearchError);
      expect(error).toMatchObject({
        name: "DialogSearchError",
        status,
        code: undefined,
        message,
      });
    },
  );

  it.each([
    [401, "INVALID_WIDGET_API_KEY", "Invalid widget API key"],
    [429, "THROTTLED", "Too many requests"],
  ])(
    "still reads the code of a Nest-shaped %i guard error",
    async (status, code, message) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ statusCode: status, error: code, message }, status),
      );

      const error = await searchLexical(API_KEY, request).catch(
        (caught: unknown) => caught as DialogSearchError,
      );

      expect(error).toBeInstanceOf(DialogSearchError);
      expect(error).toMatchObject({ status, code, message });
    },
  );

  it("falls back to statusText when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );

    const error = await searchLexical(API_KEY, request).catch(
      (caught: unknown) => caught as DialogSearchError,
    );

    expect(error).toBeInstanceOf(DialogSearchError);
    expect(error).toMatchObject({
      status: 502,
      code: undefined,
      message: "Bad Gateway",
    });
  });

  it("propagates network failures untouched", async () => {
    const networkError = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(networkError);

    await expect(searchLexical(API_KEY, request)).rejects.toBe(networkError);
  });

  it("forwards the AbortSignal and preserves the native AbortError", async () => {
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    fetchMock.mockRejectedValue(abortError);
    const controller = new AbortController();

    await expect(
      searchLexical(API_KEY, request, { signal: controller.signal }),
    ).rejects.toBe(abortError);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});
