import { searchIndexName } from "../services/search";
import {
  SearchIndex,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchSection } from "../types/searchController";

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
  sections: Partial<Record<SearchIndex, SearchResult>> | undefined;
}

export const buildSearchRequest = (
  query: string,
  page: number,
  sections: readonly SearchSection[],
  { indexName, language, currency, hitsPerPage }: SearchRequestConfig,
): SearchRequest => ({
  requests: [
    { indexName, query, page, hitsPerPage },
    ...sections.map((section) => ({
      indexName: searchIndexName(section.index, language, currency),
      query,
      page: 0,
      hitsPerPage: section.hitsPerPage ?? hitsPerPage,
    })),
  ],
});

export const readSearchResults = (
  result: SearchResponse,
  requested: readonly SearchSection[],
  { indexName, language, currency }: SearchRequestConfig,
): SearchResults => {
  const response = result.results.find((entry) => entry.index === indexName);
  if (response === undefined) {
    throw new Error(`Dialog search returned no ${indexName} entry`);
  }
  const sections: Partial<Record<SearchIndex, SearchResult>> = {};
  for (const section of requested) {
    const requestedIndexName = searchIndexName(
      section.index,
      language,
      currency,
    );
    const entry = result.results.find(
      (candidate) => candidate.index === requestedIndexName,
    );
    if (entry !== undefined) {
      sections[section.index] = entry;
    }
  }

  return {
    response,
    sections: requested.length === 0 ? undefined : sections,
  };
};
