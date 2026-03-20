import type {UseQueryResult} from '@tanstack/react-query';
import type {Artwork, ArtworkSlot} from '@/types/artwork';
import {isNotFoundError, isForbiddenError} from './errors';

/**
 * Maps React Query results to ArtworkSlot objects for UI rendering.
 *
 * This allows the UI to render different states:
 * - loaded: successfully fetched artwork
 * - loading: fetch in progress
 * - unavailable: 404 — artwork not found
 * - restricted: 403 — access forbidden
 *
 * @param queries - Array of React Query results for artworks
 * @param ids - Array of artwork IDs corresponding to each query
 * @returns Array of ArtworkSlot objects for rendering
 */
export function mapQueriesToArtworkSlots(
    queries: UseQueryResult<Artwork, Error>[],
    ids: number[],
): ArtworkSlot[] {
    return queries.map((q, index) => {
        const id = ids[index]!;

        if (q.isLoading) {
            return {status: 'loading' as const, id};
        }

        if (q.data) {
            return {status: 'loaded' as const, artwork: q.data};
        }

        if (q.error && isNotFoundError(q.error)) {
            return {status: 'unavailable' as const, id};
        }

        if (q.error && isForbiddenError(q.error)) {
            return {status: 'restricted' as const, id};
        }

        // For any other error, treat as unavailable
        if (q.error) {
            return {status: 'unavailable' as const, id};
        }

        // Default fallback — should not normally reach here
        return {status: 'loading' as const, id};
    });
}
