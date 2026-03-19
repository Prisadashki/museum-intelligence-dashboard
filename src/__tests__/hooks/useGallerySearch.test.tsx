import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {useGallerySearch} from '@/features/gallery/useGallerySearch';
import {searchResponseFixture, emptySearchResponse} from '../fixtures/searchResponse';
import {validRawObject} from '../fixtures/rawObject';
import type {GalleryFilters} from '@/types/artwork';

// Mock the API endpoints module
vi.mock('@/api/endpoints', () => ({
    searchObjects: vi.fn(),
    getObject: vi.fn(),
}));

import {searchObjects, getObject} from '@/api/endpoints';

const mockSearchObjects = vi.mocked(searchObjects);
const mockGetObject = vi.mocked(getObject);

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });

    return function Wrapper({children}: {children: ReactNode}) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

const defaultFilters: GalleryFilters = {
    query: '',
    departmentId: null,
    fromYear: null,
    toYear: null,
    highlightsOnly: true,
    includeWithoutImages: false,
};

describe('useGallerySearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty state when search returns no IDs', async () => {
        mockSearchObjects.mockResolvedValue(emptySearchResponse);

        const {result} = renderHook(() => useGallerySearch({filters: defaultFilters, page: 0}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
        });

        expect(result.current.artworkSlots).toEqual([]);
        expect(result.current.totalResults).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
    });

    it('returns hasNextPage=true when more IDs exist beyond current page', async () => {
        mockSearchObjects.mockResolvedValue(searchResponseFixture); // 50 IDs
        mockGetObject.mockResolvedValue(validRawObject);

        const {result} = renderHook(
            () =>
                useGallerySearch({
                    filters: {...defaultFilters, query: 'art'},
                    page: 0,
                }),
            {wrapper: createWrapper()},
        );

        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
        });

        // 50 total, page 0 shows 20, so hasNextPage should be true
        expect(result.current.hasNextPage).toBe(true);
    });

    it('returns hasNextPage=false when all IDs are fetched', async () => {
        const smallResponse = {
            total: 10,
            objectIDs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        };
        mockSearchObjects.mockResolvedValue(smallResponse);
        mockGetObject.mockResolvedValue(validRawObject);

        const {result} = renderHook(
            () =>
                useGallerySearch({
                    filters: {...defaultFilters, query: 'art'},
                    page: 0,
                }),
            {wrapper: createWrapper()},
        );

        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
        });

        // 10 total, page 0 shows up to 20, so hasNextPage should be false
        expect(result.current.hasNextPage).toBe(false);
    });

    it('handles search error gracefully', async () => {
        mockSearchObjects.mockRejectedValue(new Error('Network error'));

        const {result} = renderHook(
            () =>
                useGallerySearch({
                    filters: {...defaultFilters, query: 'test'},
                    page: 0,
                }),
            {wrapper: createWrapper()},
        );

        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Network error');
    });

    it('includes departmentId when filter is set', async () => {
        mockSearchObjects.mockResolvedValue(emptySearchResponse);

        const filters: GalleryFilters = {
            query: 'vase',
            departmentId: 6,
            fromYear: null,
            toYear: null,
            highlightsOnly: false,
            includeWithoutImages: false,
        };

        renderHook(() => useGallerySearch({filters, page: 0}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                departmentId: 6,
            }),
            expect.any(Object),
        );
    });

    it('includes date range when fromYear and toYear are set', async () => {
        mockSearchObjects.mockResolvedValue(emptySearchResponse);

        const filters: GalleryFilters = {
            query: 'sculpture',
            departmentId: null,
            fromYear: -500,
            toYear: 200,
            highlightsOnly: false,
            includeWithoutImages: false,
        };

        renderHook(() => useGallerySearch({filters, page: 0}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                dateBegin: -500,
                dateEnd: 200,
            }),
            expect.any(Object),
        );
    });

    it('does not fetch stale artwork IDs when filters change rapidly', async () => {
        // Setup: First search returns IDs [100, 101, 102]
        const firstSearchResult = {total: 3, objectIDs: [100, 101, 102]};
        // Second search returns different IDs [200, 201]
        const secondSearchResult = {total: 2, objectIDs: [200, 201]};

        // First call resolves immediately
        mockSearchObjects.mockResolvedValueOnce(firstSearchResult);
        
        // Track which artwork IDs are fetched
        const fetchedIds: number[] = [];
        mockGetObject.mockImplementation(async (id: number) => {
            fetchedIds.push(id);
            return {...validRawObject, objectID: id};
        });

        const queryClient = new QueryClient({
            defaultOptions: {queries: {retry: false, gcTime: 0}},
        });
        const wrapper = ({children}: {children: ReactNode}) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const firstFilters: GalleryFilters = {
            query: 'first',
            departmentId: null,
            fromYear: null,
            toYear: null,
            highlightsOnly: false,
            includeWithoutImages: false,
        };

        // Start with first filters
        const {result, rerender} = renderHook(
            ({filters, page}: {filters: GalleryFilters; page: number}) => 
                useGallerySearch({filters, page}),
            {wrapper, initialProps: {filters: firstFilters, page: 0}},
        );

        // Wait for first search to complete and artworks to load
        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
            expect(result.current.isLoadingArtworks).toBe(false);
        });

        // Verify first search artworks were fetched
        expect(fetchedIds).toContain(100);
        expect(fetchedIds).toContain(101);
        expect(fetchedIds).toContain(102);

        // Clear tracked IDs for next phase
        fetchedIds.length = 0;

        // Setup second search - will be slow
        let resolveSecondSearch: (value: typeof secondSearchResult) => void;
        mockSearchObjects.mockImplementationOnce(
            () => new Promise(resolve => {
                resolveSecondSearch = resolve;
            }),
        );

        // Change filters (simulate user selecting a department)
        const secondFilters: GalleryFilters = {
            query: 'second',
            departmentId: 5,
            fromYear: null,
            toYear: null,
            highlightsOnly: false,
            includeWithoutImages: false,
        };
        rerender({filters: secondFilters, page: 0});

        // At this point, new search is pending
        // The old IDs [100, 101, 102] should NOT be fetched again
        
        // Give time for any incorrect fetches to start
        await new Promise(r => setTimeout(r, 50));
        
        // Should not have fetched old IDs
        expect(fetchedIds).not.toContain(100);
        expect(fetchedIds).not.toContain(101);
        expect(fetchedIds).not.toContain(102);

        // Now resolve the second search
        resolveSecondSearch!(secondSearchResult);

        // Wait for second search and artworks to load
        await waitFor(() => {
            expect(result.current.isSearching).toBe(false);
            expect(result.current.isLoadingArtworks).toBe(false);
        });

        // Only new IDs should have been fetched after filter change
        expect(fetchedIds).toContain(200);
        expect(fetchedIds).toContain(201);
        expect(fetchedIds).not.toContain(100);
    });
});
