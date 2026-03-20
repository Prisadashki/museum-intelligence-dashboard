// Use proxy in both dev and production to avoid CORS issues on error responses.
// In dev: Vite proxy handles /api → Met API
// In prod: Vercel Edge Function handles /api → Met API
export const API_BASE_URL = '/api';
export const PAGE_SIZE = 9;
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

// The Met API requires BOTH dateBegin AND dateEnd for date filtering to work.
// If only one is provided, the API ignores the filter entirely.
export const EARLIEST_DATE = -10000; // Very old date for "beginning of time"
export const CURRENT_YEAR = new Date().getFullYear();
