// Use proxy in development to avoid CORS and rate limiting issues
export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://collectionapi.metmuseum.org/public/collection/v1';
export const PAGE_SIZE = 20;
export const RELATED_WORKS_COUNT = 10;
export const RELATED_WORKS_YEAR_RANGE = 50;
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;
export const ARTWORK_STALE_TIME = 10 * 60 * 1000;
export const DEPARTMENTS_STALE_TIME = 30 * 60 * 1000;

// Garbage-collection times — how long unused cache entries survive after becoming inactive.
// Longer gc times mean "back" navigation and revisited artworks are instant from cache.
export const SEARCH_GC_TIME = 30 * 60 * 1000; // 30 min
export const ARTWORK_GC_TIME = 30 * 60 * 1000; // 30 min
export const DEPARTMENTS_GC_TIME = 60 * 60 * 1000; // 60 min
