import {getObject} from '@/api/endpoints';
import {transformRawObject} from '@/transformers/artwork';
import {ARTWORK_STALE_TIME, ARTWORK_GC_TIME} from './constants';
import {isSkippableError} from './errors';

/**
 * Shared retry configuration for artwork queries.
 * Skips retries for 404/403 errors which are definitive responses.
 *
 * @param failureCount - Number of failed attempts
 * @param error - The error that caused the failure
 * @returns true to retry, false to stop
 */
export function artworkRetry(failureCount: number, error: unknown): boolean {
    // Don't retry 404s or 403s - these are definitive responses
    if (isSkippableError(error)) return false;
    return failureCount < 2;
}

/**
 * Common query options for fetching individual artworks.
 * Use these defaults to ensure consistent caching and retry behavior.
 */
export const artworkQueryOptions = {
    staleTime: ARTWORK_STALE_TIME,
    gcTime: ARTWORK_GC_TIME,
    retry: artworkRetry,
} as const;

/**
 * Creates a stable query configuration for fetching a single artwork.
 * Used by useQueries to avoid recreating query configs on every render.
 */
export function createArtworkQuery(id: number, enabled = true) {
    return {
        queryKey: ['artwork', id] as const,
        queryFn: async ({signal}: {signal?: AbortSignal}) => {
            const raw = await getObject(id, {signal});
            return transformRawObject(raw);
        },
        enabled,
        ...artworkQueryOptions,
    };
}
