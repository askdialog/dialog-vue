// Compile-time contract of the public API: these assertions are checked by
// `tsc` (test-type), the runtime test only anchors the file in the suite.
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  Dialog,
  DialogCallbacks,
  DialogConstructor,
  DialogSearchError,
  SearchHit,
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../index";

describe("public API types", () => {
  it("accepts construction with and without commerce callbacks", () => {
    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
    }>().toMatchTypeOf<DialogConstructor>();

    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
      callbacks: DialogCallbacks;
    }>().toMatchTypeOf<DialogConstructor>();

    // Invalid callback values must be rejected.
    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
      callbacks: { addToCart: string; getProduct: number };
    }>().not.toMatchTypeOf<DialogConstructor>();

    expectTypeOf<Dialog["currency"]>().toEqualTypeOf<string>();

    expectTypeOf<Dialog["search"]>().parameters.toMatchTypeOf<
      [SearchRequest, (SearchOptions | undefined)?]
    >();

    expectTypeOf<{
      requests: [{ indexName: string; query: string }];
    }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<{
      requests: [
        {
          indexName: string;
          query: string;
          page: number;
          hitsPerPage: number;
        },
      ];
    }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<
      Dialog["search"]
    >().returns.resolves.toEqualTypeOf<SearchResponse>();

    expectTypeOf<SearchResponse["results"]>().toEqualTypeOf<SearchResult[]>();
    expectTypeOf<SearchResult["hits"]>().toEqualTypeOf<SearchHit[]>();
    expectTypeOf<SearchResult["queryID"]>().toEqualTypeOf<string>();
    expectTypeOf<SearchHit["objectID"]>().toEqualTypeOf<string>();
    expectTypeOf<SearchHit["priceRange"]>().toMatchTypeOf<
      { min: { amount: string; currencyCode?: string } } | undefined
    >();

    const error = new DialogSearchError({ status: 404, message: "not found" });
    expectTypeOf(error.status).toEqualTypeOf<number>();
    expectTypeOf(error.code).toEqualTypeOf<string | undefined>();
    expect(error.name).toBe("DialogSearchError");
  });
});
