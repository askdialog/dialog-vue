import { searchIndexName } from "../services/search";
import {
  SearchIndex,
  SearchQuery,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchSection } from "../types/searchController";

export const buildSectionQueries = (
  sections: readonly SearchSection[],
  query: string,
  locale: string,
  hitsPerPage: number,
): SearchQuery[] =>
  sections.map((section) => ({
    indexName: searchIndexName(section.index, locale),
    query,
    page: 0,
    hitsPerPage: section.hitsPerPage ?? hitsPerPage,
  }));

export const pickSectionResults = (
  response: SearchResponse,
  sections: readonly SearchSection[],
  locale: string,
): Partial<Record<SearchIndex, SearchResult>> | undefined => {
  if (sections.length === 0) {
    return undefined;
  }
  const picked: Partial<Record<SearchIndex, SearchResult>> = {};
  for (const section of sections) {
    const sectionIndexName = searchIndexName(section.index, locale);
    const entry = response.results.find(
      (candidate) => candidate.index === sectionIndexName,
    );
    if (entry !== undefined) {
      picked[section.index] = entry;
    }
  }

  return picked;
};
