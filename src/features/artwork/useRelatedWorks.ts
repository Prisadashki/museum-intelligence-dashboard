import {useQuery} from '@tanstack/react-query';
import {searchObjects} from '@/api/endpoints';
import {useDepartments} from '@/hooks/useDepartments';
import {usePaginatedArtworks} from '@/hooks/usePaginatedArtworks';
import {findDepartmentId} from '@/utils/departments';
import {RELATED_WORKS_COUNT, RELATED_WORKS_YEAR_RANGE} from '@/utils/constants';
import {artworkQueryOptions} from '@/utils/queryConfig';
import type {Artwork} from '@/types/artwork';

export function useRelatedWorks(artwork: Artwork | undefined) {
    const {data: departments} = useDepartments();

    // Step 1: Derive search parameters from the artwork
    const departmentId = artwork && departments ? findDepartmentId(artwork.department, departments) : null;

    // Derive search term — fallback chain: classification → culture → objectName → department
    const searchTerm = artwork
        ? (artwork.classification ?? artwork.culture ?? artwork.objectName ?? artwork.department)
        : null;

    const yearFrom = artwork?.year != null ? artwork.year - RELATED_WORKS_YEAR_RANGE : null;
    const yearTo = artwork?.year != null ? artwork.year + RELATED_WORKS_YEAR_RANGE : null;

    // Step 2: Search for related object IDs
    const searchQuery = useQuery({
        queryKey: ['related-search', artwork?.id, departmentId, searchTerm, yearFrom, yearTo] as const,
        queryFn: () =>
            searchObjects({
                query: searchTerm!,
                departmentId: departmentId ?? undefined,
                dateBegin: yearFrom ?? undefined,
                dateEnd: yearTo ?? undefined,
                hasImages: true,
            }),
        enabled: artwork != null && searchTerm != null,
        staleTime: artworkQueryOptions.staleTime,
        gcTime: artworkQueryOptions.gcTime,
    });

    // Step 3: Take first N IDs, excluding current artwork
    const relatedIds = (searchQuery.data?.objectIDs ?? [])
        .filter((id) => id !== artwork?.id)
        .slice(0, RELATED_WORKS_COUNT);

    // Step 4: Fetch artwork details
    const {artworks, isLoading: isLoadingArtworks} = usePaginatedArtworks({
        objectIds: relatedIds,
        enabled: relatedIds.length > 0,
    });

    return {
        relatedArtworks: artworks,
        isLoading: searchQuery.isLoading || isLoadingArtworks,
        isSearching: searchQuery.isLoading,
        totalFound: searchQuery.data?.total ?? 0,
    };
}
