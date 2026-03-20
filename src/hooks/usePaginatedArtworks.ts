import {useQueries} from '@tanstack/react-query';
import {createArtworkQuery} from '@/utils/queryConfig';
import {isSkippableError} from '@/utils/errors';
import type {Artwork} from '@/types/artwork';

interface UsePaginatedArtworksParams {
    objectIds: number[];
    enabled?: boolean;
}

export function usePaginatedArtworks({objectIds, enabled = true}: UsePaginatedArtworksParams) {
    const queries = useQueries({
        queries: objectIds.map((id) => createArtworkQuery(id, enabled)),
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
