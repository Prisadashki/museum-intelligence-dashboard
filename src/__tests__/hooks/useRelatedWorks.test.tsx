import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {useRelatedWorks} from '@/features/artwork/useRelatedWorks';
import {departmentsFixture} from '../fixtures/departments';
import {validRawObject} from '../fixtures/rawObject';
import type {Artwork} from '@/types/artwork';

// Mock the API endpoints module
vi.mock('@/api/endpoints', () => ({
    searchObjects: vi.fn(),
    getObject: vi.fn(),
    getDepartments: vi.fn(),
}));

import {searchObjects, getObject, getDepartments} from '@/api/endpoints';

const mockSearchObjects = vi.mocked(searchObjects);
const mockGetObject = vi.mocked(getObject);
const mockGetDepartments = vi.mocked(getDepartments);

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

const baseArtwork: Artwork = {
    id: 123,
    title: 'Test Artwork',
    artist: 'Test Artist',
    year: 1500,
    yearEnd: 1510,
    dateDisplay: 'ca. 1500',
    department: 'Asian Art',
    departmentId: 6,
    imageSmall: 'https://example.com/small.jpg',
    imageLarge: 'https://example.com/large.jpg',
    medium: 'Oil on canvas',
    dimensions: '10 x 10 in',
    accessionNumber: '12.345',
    creditLine: 'Gift of someone',
    tags: ['Nature'],
    culture: 'Japanese',
    classification: 'Paintings',
    objectName: 'Hanging scroll',
    isPublicDomain: true,
};

describe('useRelatedWorks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetDepartments.mockResolvedValue(departmentsFixture);
    });

    it('derives search term from artwork classification', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            classification: 'Sculpture',
            culture: 'French',
            objectName: 'Statue',
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                query: 'Sculpture',
            }),
        );
    });

    it('falls back to culture when classification is null', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            classification: null,
            culture: 'Egyptian',
            objectName: 'Vase',
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                query: 'Egyptian',
            }),
        );
    });

    it('falls back to objectName when culture is null', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            classification: null,
            culture: null,
            objectName: 'Tapestry',
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                query: 'Tapestry',
            }),
        );
    });

    it('falls back to department when all else is null', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            classification: null,
            culture: null,
            objectName: null,
            department: 'European Paintings',
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                query: 'European Paintings',
            }),
        );
    });

    it('excludes current artwork from results', async () => {
        const artworkId = 123;
        mockSearchObjects.mockResolvedValue({
            total: 5,
            objectIDs: [artworkId, 200, 201, 202, 203],
        });
        mockGetObject.mockResolvedValue(validRawObject);

        const {result} = renderHook(() => useRelatedWorks(baseArtwork), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Should fetch 4 objects (excluding the current one)
        expect(mockGetObject).toHaveBeenCalledTimes(4);
        // Should NOT have been called with the current artwork ID
        expect(mockGetObject).not.toHaveBeenCalledWith(artworkId);
    });

    it('limits results to 10', async () => {
        mockSearchObjects.mockResolvedValue({
            total: 25,
            objectIDs: Array.from({length: 25}, (_, i) => i + 200),
        });
        mockGetObject.mockResolvedValue(validRawObject);

        const {result} = renderHook(() => useRelatedWorks(baseArtwork), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Should only fetch 10 objects max
        expect(mockGetObject).toHaveBeenCalledTimes(10);
    });

    it('uses ±50 year range from artwork year', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            year: 1600,
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                dateBegin: 1550,
                dateEnd: 1650,
            }),
        );
    });

    it('handles artwork with no year', async () => {
        mockSearchObjects.mockResolvedValue({total: 0, objectIDs: null});

        const artwork: Artwork = {
            ...baseArtwork,
            year: null,
        };

        renderHook(() => useRelatedWorks(artwork), {wrapper: createWrapper()});

        await waitFor(() => {
            expect(mockSearchObjects).toHaveBeenCalled();
        });

        // dateBegin and dateEnd should be undefined when year is null
        expect(mockSearchObjects).toHaveBeenCalledWith(
            expect.objectContaining({
                dateBegin: undefined,
                dateEnd: undefined,
            }),
        );
    });

    it('is disabled when artwork is undefined', async () => {
        const {result} = renderHook(() => useRelatedWorks(undefined), {
            wrapper: createWrapper(),
        });

        // Should not call search when artwork is undefined
        expect(mockSearchObjects).not.toHaveBeenCalled();
        expect(result.current.relatedArtworks).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });
});
