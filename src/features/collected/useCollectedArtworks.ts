import {useMemo} from 'react';
import {useQueries} from '@tanstack/react-query';
import {useCollectedStore} from '@/store/collectedStore';
import {createArtworkQuery} from '@/utils/queryConfig';
import {mapQueriesToArtworkSlots} from '@/utils/artworkSlots';
import {isSkippableError} from '@/utils/errors';

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
        queries: collectedIds.map((id) => createArtworkQuery(id)),
    });

    const artworkSlots = useMemo(
        () => mapQueriesToArtworkSlots(artworkQueries, collectedIds),
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
