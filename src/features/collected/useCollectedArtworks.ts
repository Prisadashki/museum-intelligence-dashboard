import {useMemo} from 'react';
import {useQueries} from '@tanstack/react-query';
import {getObject} from '@/api/endpoints';
import {transformRawObject} from '@/transformers/artwork';
import {useCollectedStore} from '@/store/collectedStore';
import {ARTWORK_STALE_TIME, ARTWORK_GC_TIME} from '@/utils/constants';
import {isSkippableError, isNotFoundError, isForbiddenError} from '@/utils/errors';
import type {ArtworkSlot} from '@/types/artwork';

/**
 * Fetches all collected artworks by their IDs.
 * Returns artworks in the order they were collected (Set iteration order).
 */
export function useCollectedArtworks() {
    // Get the Set directly - Zustand will use reference equality
    const collectedIdsSet = useCollectedStore((s) => s.collectedIds);

    // Derive array only when Set changes (reference changes on mutation)
    const collectedIds = useMemo(() => Array.from(collectedIdsSet), [collectedIdsSet]);

    const artworkQueries = useQueries({
        queries: collectedIds.map((id) => ({
            queryKey: ['artwork', id] as const,
            queryFn: async () => {
                const raw = await getObject(id);
                return transformRawObject(raw);
            },
            staleTime: ARTWORK_STALE_TIME,
            gcTime: ARTWORK_GC_TIME,
            // Don't retry 404s - the artwork doesn't exist
            retry: (failureCount: number, error: unknown) => {
                if (isSkippableError(error)) return false;
                return failureCount < 2;
            },
        })),
    });

    const artworkSlots = useMemo<ArtworkSlot[]>(
        () =>
            artworkQueries.map((q, index) => {
                const id = collectedIds[index]!;
                if (q.isLoading) return {status: 'loading' as const, id};
                if (q.data) return {status: 'loaded' as const, artwork: q.data};
                if (q.error && isNotFoundError(q.error)) return {status: 'unavailable' as const, id};
                if (q.error && isForbiddenError(q.error)) return {status: 'restricted' as const, id};
                if (q.error) return {status: 'unavailable' as const, id};
                return {status: 'loading' as const, id};
            }),
        [artworkQueries, collectedIds],
    );

    const loadedCount = artworkSlots.filter((s) => s.status === 'loaded').length;
    const isLoading = artworkQueries.some((q) => q.isLoading);
    const error = artworkQueries.find((q) => q.error && !isSkippableError(q.error))?.error;

    return {
        artworkSlots,
        loadedCount,
        isLoading,
        isEmpty: collectedIds.length === 0,
        error: error instanceof Error ? error : null,
    };
}
