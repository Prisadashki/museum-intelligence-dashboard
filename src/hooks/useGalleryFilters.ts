import {useSearchParams} from 'react-router-dom';
import {useCallback, useMemo} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {requestQueue} from '@/api/requestQueue';
import type {GalleryFilters} from '@/types/artwork';

function parseIntOrNull(value: string | null): number | null {
    if (value == null) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function parseBool(value: string | null, defaultValue: boolean): boolean {
    if (value == null) return defaultValue;
    return value === 'true';
}

/**
 * Reads gallery filters and pagination from URL search params.
 * URL shape: /gallery?query=statue&department=11&fromYear=-500&toYear=200&highlights=true&page=2
 *
 * Page is automatically reset to 0 when filters change (by removing from URL).
 */
export function useGalleryFilters() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const filters: GalleryFilters = useMemo(
        () => ({
            query: searchParams.get('query') ?? '',
            departmentId: parseIntOrNull(searchParams.get('department')),
            fromYear: parseIntOrNull(searchParams.get('fromYear')),
            toYear: parseIntOrNull(searchParams.get('toYear')),
            highlightsOnly: parseBool(searchParams.get('highlights'), false),
            includeWithoutImages: parseBool(searchParams.get('noImages'), false),
        }),
        [searchParams],
    );

    const page = useMemo(() => {
        const pageParam = parseIntOrNull(searchParams.get('page'));
        return pageParam != null && pageParam >= 0 ? pageParam : 0;
    }, [searchParams]);

    const setPage = useCallback(
        (newPage: number) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (newPage > 0) {
                        next.set('page', String(newPage));
                    } else {
                        next.delete('page');
                    }
                    return next;
                },
                {replace: true},
            );
        },
        [setSearchParams],
    );

    /**
     * Cancels all pending and in-flight artwork AND search requests.
     * Call this BEFORE changing filters to prevent old requests from
     * consuming rate limit quota and causing 403 errors.
     */
    const cancelArtworkRequests = useCallback(() => {
        // 1. Clear pending requests from the queue (not yet started)
        requestQueue.clear();
        // 2. Cancel in-flight artwork requests
        queryClient.cancelQueries({queryKey: ['artwork']});
        // 3. Cancel in-flight search requests (prevents stale search from competing)
        queryClient.cancelQueries({queryKey: ['search']});
    }, [queryClient]);

    const setFilters = useCallback(
        (updates: Partial<GalleryFilters>) => {
            // Cancel all artwork requests BEFORE updating filters
            cancelArtworkRequests();

            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);

                    // Reset page when filters change
                    next.delete('page');

                    if (updates.query !== undefined) {
                        if (updates.query) next.set('query', updates.query);
                        else next.delete('query');
                    }
                    if (updates.departmentId !== undefined) {
                        if (updates.departmentId != null) next.set('department', String(updates.departmentId));
                        else next.delete('department');
                    }
                    if (updates.fromYear !== undefined) {
                        if (updates.fromYear != null) next.set('fromYear', String(updates.fromYear));
                        else next.delete('fromYear');
                    }
                    if (updates.toYear !== undefined) {
                        if (updates.toYear != null) next.set('toYear', String(updates.toYear));
                        else next.delete('toYear');
                    }
                if (updates.highlightsOnly !== undefined) {
                    // Only store in URL if true (false is default, keep URL clean)
                    if (updates.highlightsOnly) next.set('highlights', 'true');
                    else next.delete('highlights');
                }
                if (updates.includeWithoutImages !== undefined) {
                    if (updates.includeWithoutImages) next.set('noImages', 'true');
                    else next.delete('noImages');
                }

                    return next;
                },
                {replace: true},
            );
        },
        [setSearchParams, cancelArtworkRequests],
    );

    const resetFilters = useCallback(() => {
        // Cancel all artwork requests before resetting filters
        cancelArtworkRequests();
        setSearchParams({}, {replace: true});
    }, [setSearchParams, cancelArtworkRequests]);

    return {filters, setFilters, resetFilters, page, setPage};
}
