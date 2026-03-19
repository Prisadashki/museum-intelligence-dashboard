import {useQueries} from '@tanstack/react-query';
import {getObject} from '@/api/endpoints';
import {transformRawObject} from '@/transformers/artwork';
import {ARTWORK_STALE_TIME, ARTWORK_GC_TIME} from '@/utils/constants';
import {isSkippableError} from '@/utils/errors';
import type {Artwork} from '@/types/artwork';

interface UsePaginatedArtworksParams {
    objectIds: number[];
    enabled?: boolean;
}

export function usePaginatedArtworks({objectIds, enabled = true}: UsePaginatedArtworksParams) {
    const queries = useQueries({
        queries: objectIds.map((id) => ({
            queryKey: ['artwork', id] as const,
            queryFn: async () => {
                const raw = await getObject(id);
                return transformRawObject(raw);
            },
            staleTime: ARTWORK_STALE_TIME,
            gcTime: ARTWORK_GC_TIME,
            enabled,
            // Don't retry 404s - the artwork doesn't exist
            retry: (failureCount: number, error: unknown) => {
                if (isSkippableError(error)) return false;
                return failureCount < 2;
            },
        })),
    });

    // Filter out skippable errors (404/403), only include successful loads
    const artworks = queries.filter((q) => q.data != null).map((q) => q.data as Artwork);

    const pendingCount = queries.filter((q) => q.isLoading).length;

    // Only report non-skippable errors
    const errors = queries.filter((q) => q.error != null && !isSkippableError(q.error)).map((q) => q.error as Error);

    return {
        artworks,
        pendingCount,
        isLoading: pendingCount > 0,
        errors,
    };
}
