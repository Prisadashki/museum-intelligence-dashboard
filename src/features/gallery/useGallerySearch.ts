import {useEffect, useMemo} from 'react';
import {useQuery, useQueries, useQueryClient} from '@tanstack/react-query';
import {searchObjects, getObject} from '@/api/endpoints';
import {transformRawObject} from '@/transformers/artwork';
import {PAGE_SIZE, DEFAULT_STALE_TIME, ARTWORK_STALE_TIME, SEARCH_GC_TIME, ARTWORK_GC_TIME} from '@/utils/constants';
import {isSkippableError, isNotFoundError, isForbiddenError} from '@/utils/errors';
import type {GalleryFilters, ArtworkSlot} from '@/types/artwork';

/**
 * Creates a stable string key from filters for comparison.
 * Used to detect when filters have changed between renders.
 */
function getFiltersKey(filters: GalleryFilters): string {
    return JSON.stringify(filters);
}

interface UseGallerySearchParams {
    filters: GalleryFilters;
    page: number;
}

// The Met API requires BOTH dateBegin AND dateEnd for date filtering to work.
// If only one is provided, the API seems to ignore it entirely.
const EARLIEST_DATE = -10000; // Very old date for "beginning of time"
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Search result with embedded filters key for staleness detection.
 * The filtersKey is captured at query execution time, allowing us to
 * detect if cached data belongs to a different filter set.
 */
interface TaggedSearchResult {
    objectIDs: number[];
    total: number;
    filtersKey: string;
}

export function useGallerySearch({filters, page}: UseGallerySearchParams) {
    const queryClient = useQueryClient();

    // Create a stable key for the current filters
    const filtersKey = getFiltersKey(filters);

    // Step 1: Search for object IDs
    // By default, we request hasImages=true for consistent results.
    // Users can opt-in to include artworks without images.
    //
    // IMPORTANT: We tag the result with the filtersKey that was used to fetch it.
    // This allows us to detect stale cached data during the race condition window
    // between filter change and React Query fetch start.
    const searchQuery = useQuery({
        queryKey: ['search', filters] as const,
        queryFn: async ({signal}): Promise<TaggedSearchResult> => {
            // Compute effective date range INSIDE queryFn to avoid stale closure values.
            // The Met API requires BOTH dateBegin AND dateEnd for date filtering to work.
            const hasDateFilter = filters.fromYear != null || filters.toYear != null;
            const effectiveDateBegin = hasDateFilter ? (filters.fromYear ?? EARLIEST_DATE) : undefined;
            const effectiveDateEnd = hasDateFilter ? (filters.toYear ?? CURRENT_YEAR) : undefined;

            const result = await searchObjects(
                {
                    query: filters.query || '*',
                    departmentId: filters.departmentId ?? undefined,
                    dateBegin: effectiveDateBegin,
                    dateEnd: effectiveDateEnd,
                    hasImages: filters.includeWithoutImages ? undefined : true,
                    isHighlight: filters.highlightsOnly || undefined,
                },
                {signal},
            );
            // Tag the result with the filtersKey at fetch time
            return {
                objectIDs: result.objectIDs ?? [],
                total: result.total,
                filtersKey,
            };
        },
        staleTime: DEFAULT_STALE_TIME,
        gcTime: SEARCH_GC_TIME,
        placeholderData: undefined,
    });

    // Window-based pagination: only fetch IDs for the current page.
    // Sort IDs numerically to ensure stable pagination — the Met API doesn't guarantee
    // a consistent order across requests, so without sorting, returning to page 1
    // might show different artworks than before if the cache was refreshed.
    //
    // CRITICAL: Only use IDs when the data's filtersKey matches current filters.
    // This prevents a race condition where:
    //   1. Filters change → triggers re-render
    //   2. React Query hasn't started fetching yet (isFetching=false)
    //   3. searchQuery.data still contains OLD IDs from previous filters
    // By checking data.filtersKey !== filtersKey, we detect stale cached data.
    const allIds = useMemo(() => {
        // While loading or fetching, return empty to prevent using stale data
        if (searchQuery.isLoading || searchQuery.isFetching) return [];
        // Only use data if the query succeeded
        if (!searchQuery.isSuccess) return [];
        // RACE CONDITION CHECK: Verify data was fetched with current filters
        if (searchQuery.data.filtersKey !== filtersKey) return [];

        const ids = searchQuery.data.objectIDs;
        return [...ids].sort((a, b) => a - b);
    }, [searchQuery.data, searchQuery.isLoading, searchQuery.isFetching, searchQuery.isSuccess, filtersKey]);

    const pageStart = page * PAGE_SIZE;
    const pageEnd = pageStart + PAGE_SIZE;
    const pageIds = allIds.slice(pageStart, pageEnd);
    const totalPages = Math.ceil(allIds.length / PAGE_SIZE);

    // Track whether we should enable artwork fetching.
    // Disable when search is loading/fetching OR when data doesn't match current filters.
    const isSearchStale = searchQuery.isLoading || searchQuery.isFetching || 
        (searchQuery.isSuccess && searchQuery.data.filtersKey !== filtersKey);

    // Only create artwork queries when search data is fresh.
    // When stale, use an empty array to prevent any fetches.
    const artworkIdsToFetch = useMemo(
        () => (isSearchStale ? [] : pageIds),
        [isSearchStale, pageIds]
    );

    // Step 2: Fetch individual artworks for the current page in parallel
    const artworkQueries = useQueries({
        queries: artworkIdsToFetch.map((id) => ({
            queryKey: ['artwork', id] as const,
            queryFn: async ({signal}) => {
                const raw = await getObject(id, {signal});
                return transformRawObject(raw);
            },
            staleTime: ARTWORK_STALE_TIME,
            gcTime: ARTWORK_GC_TIME,
            // Don't retry 404s or 403s - these are definitive responses
            retry: (failureCount: number, error: unknown) => {
                if (isSkippableError(error)) return false;
                return failureCount < 2;
            },
        })),
    });

    // Step 3: Prefetch next page in the background so page transitions feel instant.
    // Use an AbortController so prefetch requests can be cancelled when filters/page change.
    // Only prefetch when search data is fresh (not stale).
    const hasNextPage = pageEnd < allIds.length;
    useEffect(() => {
        // Don't prefetch if search is stale or no next page
        if (!hasNextPage || isSearchStale) return;

        const controller = new AbortController();
        const nextPageIds = allIds.slice(pageEnd, pageEnd + PAGE_SIZE);

        for (const id of nextPageIds) {
            queryClient.prefetchQuery({
                queryKey: ['artwork', id] as const,
                queryFn: async () => {
                    const raw = await getObject(id, {signal: controller.signal});
                    return transformRawObject(raw);
                },
                staleTime: ARTWORK_STALE_TIME,
                gcTime: ARTWORK_GC_TIME,
            });
        }

        // Cleanup: abort prefetch requests when dependencies change
        return () => {
            controller.abort();
        };
    }, [allIds, pageEnd, hasNextPage, queryClient, isSearchStale]);

    // Derive return values — map each query to an ArtworkSlot so the UI can
    // render unavailable (404) and restricted (403) cards instead of hiding them.
    // Use artworkIdsToFetch to ensure we're mapping the correct IDs.
    const artworkSlots = useMemo<ArtworkSlot[]>(
        () =>
            artworkQueries.map((q, index) => {
                const id = artworkIdsToFetch[index]!;
                if (q.isLoading) return {status: 'loading' as const, id};
                if (q.data) return {status: 'loaded' as const, artwork: q.data};
                if (q.error && isNotFoundError(q.error)) return {status: 'unavailable' as const, id};
                if (q.error && isForbiddenError(q.error)) return {status: 'restricted' as const, id};
                // For any other error, treat as unavailable
                if (q.error) return {status: 'unavailable' as const, id};
                return {status: 'loading' as const, id};
            }),
        [artworkQueries, artworkIdsToFetch],
    );

    const isLoadingArtworks = artworkQueries.some((q) => q.isLoading);

    return {
        artworkSlots,
        totalResults: searchQuery.data?.total ?? 0,
        totalPages,
        isSearching: searchQuery.isLoading || searchQuery.isFetching,
        isLoadingArtworks,
        hasNextPage,
        hasPreviousPage: page > 0,
        error: searchQuery.error instanceof Error ? searchQuery.error : null,
        refetch: searchQuery.refetch,
    };
}
