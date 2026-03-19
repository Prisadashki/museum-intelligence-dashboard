/**
 * Core domain model. All UI components consume this shape.
 * Produced by the transformer layer from raw API responses.
 */
export interface Artwork {
    id: number;
    title: string;
    artist: string | null;
    year: number | null;
    yearEnd: number | null;
    dateDisplay: string | null;
    department: string;
    departmentId: number;
    imageSmall: string | null;
    imageLarge: string | null;
    medium: string | null;
    dimensions: string | null;
    accessionNumber: string | null;
    creditLine: string | null;
    tags: string[];
    culture: string | null;
    classification: string | null;
    objectName: string | null;
    isPublicDomain: boolean;
}

/**
 * Represents a single slot in an artwork grid.
 * Each slot can be in one of four states based on the API response.
 */
export type ArtworkSlot =
    | {status: 'loaded'; artwork: Artwork}
    | {status: 'loading'; id: number}
    | {status: 'unavailable'; id: number} // 404 — artwork not found
    | {status: 'restricted'; id: number}; // 403 — access forbidden

/**
 * Gallery filter state. Maps 1:1 with URL search params.
 */
export interface GalleryFilters {
    query: string;
    departmentId: number | null;
    fromYear: number | null;
    toYear: number | null;
    highlightsOnly: boolean;
    includeWithoutImages: boolean;
}

/**
 * Department reference data.
 */
export interface Department {
    id: number;
    name: string;
}

/**
 * Search result from the API — just IDs and total.
 */
export interface SearchResult {
    total: number;
    objectIds: number[];
}
