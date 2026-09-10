import { searchIndexName } from "../services/search";
import {
  SearchIndex,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { AdditionalSearchIndex } from "../types/searchController";

// Match the API minimum query length.
const MIN_QUERY_CODE_POINTS = 2;

export const normalizeQuery = (rawQuery: string): string | undefined => {
  const query = rawQuery.trim();

  return [...query].length >= MIN_QUERY_CODE_POINTS ? query : undefined;
};

interface SearchRequestConfig {
  indexName: string;
  language: string;
  currency: string;
  hitsPerPage: number;
}

interface SearchResults {
  response: SearchResult;
  additionalResults: Partial<Record<SearchIndex, SearchResult>> | undefined;
}

export const buildSearchRequest = (
  query: string,
  page: number,
  additionalIndexes: readonly AdditionalSearchIndex[],
  { indexName, language, currency, hitsPerPage }: SearchRequestConfig,
): SearchRequest => ({
  requests: [
    { indexName, query, page, hitsPerPage },
    ...additionalIndexes.map((additionalIndex) => ({
      indexName: searchIndexName(additionalIndex.index, language, currency),
      query,
      page: 0,
      hitsPerPage: additionalIndex.hitsPerPage ?? hitsPerPage,
    })),
  ],
});

export const readSearchResults = (
  result: SearchResponse,
  requested: readonly AdditionalSearchIndex[],
  { indexName, language, currency }: SearchRequestConfig,
): SearchResults => {
  const response = result.results.find((entry) => entry.index === indexName);
  if (response === undefined) {
    throw new Error(`Dialog search returned no ${indexName} entry`);
  }
  const additionalResults: Partial<Record<SearchIndex, SearchResult>> = {};
  for (const additionalIndex of requested) {
    const requestedIndexName = searchIndexName(
      additionalIndex.index,
      language,
      currency,
    );
    const entry = result.results.find(
      (candidate) => candidate.index === requestedIndexName,
    );
    if (entry !== undefined) {
      additionalResults[additionalIndex.index] = entry;
    }
  }

  return {
    response,
    additionalResults: requested.length === 0 ? undefined : additionalResults,
  };
};
