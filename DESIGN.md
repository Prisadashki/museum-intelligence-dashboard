# Museum Intelligence Dashboard — Design Specification

> **Purpose**: This document is the complete architectural blueprint for implementing the Museum Intelligence Dashboard.
> Every type, interface, transformation rule, hook signature, and component contract is specified here. Implementation
> should follow this spec file-by-file.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Type Definitions](#2-type-definitions)
3. [API Client Layer](#3-api-client-layer)
4. [Transformer Layer](#4-transformer-layer)
5. [Hooks Layer](#5-hooks-layer)
6. [Zustand Store](#6-zustand-store)
7. [Component Contracts](#7-component-contracts)
8. [Page Composition](#8-page-composition)
9. [Routing](#9-routing)
10. [Performance Strategy](#10-performance-strategy)
11. [Test Specifications](#11-test-specifications)
12. [README Template](#12-readme-template)
13. [Implementation Order](#13-implementation-order)

---

## 1. Project Setup

### 1.1 Scaffold

```bash
npm create vite@latest museum-intelligence-dashboard -- --template react-ts
```

### 1.2 Dependencies

```bash
# Core
npm install react-router-dom @tanstack/react-query zustand

# Utilities
npm install zod date-fns

# Styling
npm install -D tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 1.3 TypeScript Configuration

`tsconfig.json` must include:

```
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 1.4 Vite Configuration

`vite.config.ts`:

- Enable path alias `@/` → `./src/`
- Configure Vitest with `jsdom` environment
- Configure tailwindcss vite plugin

```
// vite.config.ts shape:
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### 1.5 Test Setup

`src/test/setup.ts`:

- Import `@testing-library/jest-dom/vitest`

### 1.6 Tailwind CSS

`src/index.css`:

```
@import "tailwindcss";
```

### 1.7 Directory Structure

```
src/
  api/
    client.ts
    schemas.ts
    endpoints.ts
  components/
    ui/
      Skeleton.tsx
      ImageWithFallback.tsx
      LoadMoreButton.tsx
      YearDisplay.tsx
      ErrorMessage.tsx
    artwork/
      ArtworkCard.tsx
      ArtworkGrid.tsx
    layout/
      Header.tsx
      Layout.tsx
  features/
    gallery/
      GalleryPage.tsx
      GalleryFilters.tsx
      useGallerySearch.ts
    artwork/
      ArtworkDetailPage.tsx
      ArtworkMeta.tsx
      RelatedWorks.tsx
      useRelatedWorks.ts
  hooks/
    useGalleryFilters.ts
    useArtwork.ts
    useDepartments.ts
    usePaginatedArtworks.ts
  store/
    collectedStore.ts
  transformers/
    artwork.ts
    department.ts
  types/
    artwork.ts
    api.ts
  utils/
    date.ts
    image.ts
    constants.ts
  test/
    setup.ts
  __tests__/
    transformers/
      artwork.test.ts
    utils/
      date.test.ts
    api/
      schemas.test.ts
    hooks/
      useGallerySearch.test.ts
      useRelatedWorks.test.ts
  App.tsx
  main.tsx
  index.css
```

---

## 2. Type Definitions

### 2.1 Internal Domain Types — `src/types/artwork.ts`

```
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
 * Gallery filter state. Maps 1:1 with URL search params.
 */
export interface GalleryFilters {
  query: string;
  departmentId: number | null;
  fromYear: number | null;
  toYear: number | null;
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
 * The actual artwork data is fetched separately.
 */
export interface SearchResult {
  total: number;
  objectIds: number[];
}
```

### 2.2 Raw API Types — `src/types/api.ts`

These types are inferred from Zod schemas (see Section 3.2). Do NOT define them manually — use `z.infer<typeof schema>`.

```
import { z } from 'zod';
import {
  rawMetObjectSchema,
  searchResponseSchema,
  departmentsResponseSchema,
} from '@/api/schemas';

export type RawMetObject = z.infer<typeof rawMetObjectSchema>;
export type RawSearchResponse = z.infer<typeof searchResponseSchema>;
export type RawDepartmentsResponse = z.infer<typeof departmentsResponseSchema>;
```

---

## 3. API Client Layer

### 3.1 HTTP Client — `src/api/client.ts`

A thin `fetch` wrapper. Responsibilities:

- Base URL management
- JSON parsing
- Error normalization
- Request timeout (10 seconds)

```
BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1"

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string
  ) {}
}

async function fetchJson<T>(path: string, schema: ZodSchema<T>): Promise<T>
  - Constructs full URL: BASE_URL + path
  - Calls fetch() with AbortController (10s timeout)
  - If !response.ok → throw ApiError
  - Parses JSON
  - Validates with schema.parse() (throws ZodError on invalid shape)
  - Returns validated data
```

**Design decision**: The `fetchJson` function takes a Zod schema as a parameter. This means validation happens at the
HTTP boundary — the earliest possible point. No raw data escapes into the app.

### 3.2 Zod Schemas — `src/api/schemas.ts`

```
import { z } from 'zod';

// --- Tag schema ---
const tagSchema = z.object({
  term: z.string(),
  AAT_URL: z.string().optional(),
  Wikidata_URL: z.string().optional(),
});

// --- Single object response ---
export const rawMetObjectSchema = z.object({
  objectID: z.number(),
  title: z.string().default(''),
  artistDisplayName: z.string().default(''),
  objectDate: z.string().default(''),
  objectBeginDate: z.number().default(0),
  objectEndDate: z.number().default(0),
  department: z.string().default(''),
  primaryImage: z.string().default(''),
  primaryImageSmall: z.string().default(''),
  medium: z.string().default(''),
  dimensions: z.string().default(''),
  accessionNumber: z.string().default(''),
  creditLine: z.string().default(''),
  tags: z.array(tagSchema).nullable().default(null),
  culture: z.string().default(''),
  classification: z.string().default(''),
  objectName: z.string().default(''),
  isPublicDomain: z.boolean().default(false),
}).passthrough();
// passthrough() allows extra fields we don't use without failing validation

// --- Search response ---
export const searchResponseSchema = z.object({
  total: z.number(),
  objectIDs: z.array(z.number()).nullable().default(null),
});

// --- Departments response ---
const departmentSchema = z.object({
  departmentId: z.number(),
  displayName: z.string(),
});

export const departmentsResponseSchema = z.object({
  departments: z.array(departmentSchema),
});
```

**Key schema decisions**:

- All string fields use `.default('')` — the API sometimes returns `null` or omits fields. Defaults prevent downstream
  null checks in the transformer.
- `tags` is `.nullable()` — the API returns `null` when no tags exist (not an empty array).
- `objectIDs` in search is `.nullable()` — the API returns `null` instead of an empty array when no results match.
- `.passthrough()` on the object schema — we don't want to fail if the API adds new fields.

### 3.3 Endpoint Functions — `src/api/endpoints.ts`

```
import { fetchJson } from './client';
import {
  rawMetObjectSchema,
  searchResponseSchema,
  departmentsResponseSchema,
} from './schemas';
import type { RawMetObject, RawSearchResponse, RawDepartmentsResponse } from '@/types/api';

// --- Search params type ---
export interface SearchParams {
  query: string;
  departmentId?: number;
  dateBegin?: number;
  dateEnd?: number;
  hasImages?: boolean;
  isHighlight?: boolean;
}

// --- Endpoint functions ---

/**
 * Search for objects matching the given criteria.
 * Returns only object IDs — details must be fetched separately.
 */
export async function searchObjects(params: SearchParams): Promise<RawSearchResponse> {
  // Build query string from params
  // q={query}&departmentId={id}&dateBegin={begin}&dateEnd={end}&hasImages=true
  // IMPORTANT: dateBegin and dateEnd must BOTH be present or BOTH absent
  // IMPORTANT: hasImages should default to true for gallery searches
  const searchParams = new URLSearchParams();
  searchParams.set('q', params.query);
  if (params.departmentId != null) {
    searchParams.set('departmentId', String(params.departmentId));
  }
  if (params.dateBegin != null && params.dateEnd != null) {
    searchParams.set('dateBegin', String(params.dateBegin));
    searchParams.set('dateEnd', String(params.dateEnd));
  }
  if (params.hasImages) {
    searchParams.set('hasImages', 'true');
  }
  if (params.isHighlight) {
    searchParams.set('isHighlight', 'true');
  }
  return fetchJson(`/search?${searchParams.toString()}`, searchResponseSchema);
}

/**
 * Fetch a single object by ID.
 */
export async function getObject(id: number): Promise<RawMetObject> {
  return fetchJson(`/objects/${id}`, rawMetObjectSchema);
}

/**
 * Fetch all departments. Call once, cache for a long time.
 */
export async function getDepartments(): Promise<RawDepartmentsResponse> {
  return fetchJson('/departments', departmentsResponseSchema);
}
```

---

## 4. Transformer Layer

### 4.1 Artwork Transformer — `src/transformers/artwork.ts`

Pure function. No side effects. Highest-value test target.

```
import type { RawMetObject } from '@/types/api';
import type { Artwork } from '@/types/artwork';

/**
 * Transforms a raw Met API object response into our internal Artwork model.
 *
 * Rules:
 * - Empty strings → null (for optional fields)
 * - tags array of objects → array of term strings
 * - objectBeginDate → year (0 treated as null — many objects use 0 as "unknown")
 * - Preserves department name and derives departmentId from it (N/A — we don't get departmentId from object endpoint)
 */
export function transformRawObject(raw: RawMetObject): Artwork {
  return {
    id: raw.objectID,
    title: raw.title || 'Untitled',
    artist: emptyToNull(raw.artistDisplayName),
    year: raw.objectBeginDate !== 0 ? raw.objectBeginDate : null,
    yearEnd: raw.objectEndDate !== 0 ? raw.objectEndDate : null,
    dateDisplay: emptyToNull(raw.objectDate),
    department: raw.department || 'Unknown Department',
    departmentId: 0, // NOTE: Object endpoint doesn't return departmentId.
                      // We'll need to resolve this via department name lookup
                      // or store it when we have it from search context.
                      // See Section 5.4 for the resolution strategy.
    imageSmall: emptyToNull(raw.primaryImageSmall),
    imageLarge: emptyToNull(raw.primaryImage),
    medium: emptyToNull(raw.medium),
    dimensions: emptyToNull(raw.dimensions),
    accessionNumber: emptyToNull(raw.accessionNumber),
    creditLine: emptyToNull(raw.creditLine),
    tags: extractTags(raw.tags),
    culture: emptyToNull(raw.culture),
    classification: emptyToNull(raw.classification),
    objectName: emptyToNull(raw.objectName),
    isPublicDomain: raw.isPublicDomain,
  };
}

// --- Helper functions (exported for testing) ---

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function extractTags(
  tags: Array<{ term: string }> | null | undefined
): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags
    .map(tag => tag.term)
    .filter((term): term is string => typeof term === 'string' && term.trim() !== '');
}
```

### 4.2 Department Transformer — `src/transformers/department.ts`

```
import type { RawDepartmentsResponse } from '@/types/api';
import type { Department } from '@/types/artwork';

export function transformDepartments(raw: RawDepartmentsResponse): Department[] {
  return raw.departments.map(dept => ({
    id: dept.departmentId,
    name: dept.displayName,
  }));
}
```

### 4.3 DepartmentId Resolution Strategy

**Problem**: The `/objects/{id}` endpoint returns `department` as a string name (e.g., "European Paintings") but NOT the
`departmentId` number. The related works engine needs `departmentId` to filter searches.

**Solution**: Build a department name → ID lookup map from the `/departments` endpoint (fetched once, cached 30 min).
Provide a utility:

```
// In src/utils/departments.ts or as part of the useDepartments hook:
export function findDepartmentId(
  departmentName: string,
  departments: Department[]
): number | null {
  const dept = departments.find(
    d => d.name.toLowerCase() === departmentName.toLowerCase()
  );
  return dept?.id ?? null;
}
```

This is used in the related works engine (Section 5.4).

---

## 5. Hooks Layer

### 5.1 Query Client Configuration — in `main.tsx` or `App.tsx`

```
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,    // Museum data doesn't change in real-time
    },
  },
});
```

### 5.2 Department Hook — `src/hooks/useDepartments.ts`

```
import { useQuery } from '@tanstack/react-query';
import { getDepartments } from '@/api/endpoints';
import { transformDepartments } from '@/transformers/department';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const raw = await getDepartments();
      return transformDepartments(raw);
    },
    staleTime: 30 * 60 * 1000, // 30 min — effectively static
  });
}
```

### 5.3 Single Artwork Hook — `src/hooks/useArtwork.ts`

```
import { useQuery } from '@tanstack/react-query';
import { getObject } from '@/api/endpoints';
import { transformRawObject } from '@/transformers/artwork';

export function useArtwork(objectId: number) {
  return useQuery({
    queryKey: ['artwork', objectId],
    queryFn: async () => {
      const raw = await getObject(objectId);
      return transformRawObject(raw);
    },
    staleTime: 10 * 60 * 1000, // 10 min
    enabled: objectId > 0,
  });
}
```

### 5.4 Gallery Search Hook — `src/features/gallery/useGallerySearch.ts`

This is the most complex hook. It orchestrates the two-step fetch pattern:

```
Step 1: Search → get all matching IDs
Step 2: Take IDs for current "page" → fetch each object in parallel
```

**Pseudocode:**

```
// useGallerySearch.ts

imports: useQuery, useQueries from @tanstack/react-query
imports: searchObjects, getObject from @/api/endpoints
imports: transformRawObject from @/transformers/artwork
imports: GalleryFilters, Artwork from @/types/artwork

const PAGE_SIZE = 20

interface UseGallerySearchParams {
  filters: GalleryFilters
  page: number                        // 0-indexed page number
}

interface UseGallerySearchResult {
  artworks: (Artwork | undefined)[]   // undefined = still loading
  totalResults: number
  isSearching: boolean                // Step 1 in progress
  isLoadingArtworks: boolean          // Step 2 in progress
  hasMore: boolean                    // More pages available
  error: Error | null
}

function useGallerySearch({ filters, page }): UseGallerySearchResult {
  // --- Step 1: Search for object IDs ---
  searchQuery = useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchObjects({
      query: filters.query || '*',       // fallback for default view (see Section 5.5)
      departmentId: filters.departmentId ?? undefined,
      dateBegin: filters.fromYear ?? undefined,
      dateEnd: filters.toYear ?? undefined,
      hasImages: true,
    }),
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  // Extract the IDs for the CURRENT page (and all previous pages for "Load More")
  allIds = searchQuery.data?.objectIDs ?? []
  visibleIds = allIds.slice(0, (page + 1) * PAGE_SIZE)

  // --- Step 2: Fetch individual artworks in parallel ---
  artworkQueries = useQueries({
    queries: visibleIds.map(id => ({
      queryKey: ['artwork', id],
      queryFn: async () => {
        raw = await getObject(id)
        return transformRawObject(raw)
      },
      staleTime: 10 * 60 * 1000,
    })),
  })

  // --- Derive return values ---
  artworks = artworkQueries.map(q => q.data)
  isLoadingArtworks = artworkQueries.some(q => q.isLoading)
  hasMore = allIds.length > (page + 1) * PAGE_SIZE

  return {
    artworks,
    totalResults: searchQuery.data?.total ?? 0,
    isSearching: searchQuery.isLoading,
    isLoadingArtworks,
    hasMore,
    error: searchQuery.error as Error | null,
  }
}
```

**Key behaviors:**

- `useQueries` fires all fetches in parallel. React Query deduplicates — if artwork #123 was already fetched, it returns
  from cache.
- Progressive rendering: each `artworkQueries[i].data` resolves independently. The grid renders skeletons for loading
  items and real cards for loaded items.
- "Load More" increments `page`, which extends `visibleIds`, which adds new queries. Already-fetched items remain
  cached.

### 5.5 Default Gallery Behavior

When no filters are applied (user first visits `/gallery`):

**Strategy**: Search with `q=*&hasImages=true&isHighlight=true`.

The `*` query matches broadly, and `isHighlight=true` limits results to the Met's curated highlights — a natural,
high-quality default for a museum dashboard.

**Fallback**: If `q=*` returns no results (API might not support wildcards), fall back to `q=art&hasImages=true`. This
is broad enough to return thousands of results.

Implement this in `useGallerySearch`:

```
if filters.query is empty:
  use { query: '*', isHighlight: true, hasImages: true }
else:
  use filters as-is with hasImages: true
```

### 5.6 URL Filter Hook — `src/hooks/useGalleryFilters.ts`

Bridges URL search params ↔ typed filter state.

```
import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { GalleryFilters } from '@/types/artwork';

/**
 * Reads gallery filters from URL params and provides setters that update the URL.
 *
 * URL shape: /gallery?query=statue&department=11&fromYear=-500&toYear=200
 */
export function useGalleryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: GalleryFilters = useMemo(() => ({
    query: searchParams.get('query') ?? '',
    departmentId: parseIntOrNull(searchParams.get('department')),
    fromYear: parseIntOrNull(searchParams.get('fromYear')),
    toYear: parseIntOrNull(searchParams.get('toYear')),
  }), [searchParams]);

  const setFilters = useCallback((updates: Partial<GalleryFilters>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);

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

      return next;
    }, { replace: true }); // replace to avoid polluting history with every keystroke
  }, [setSearchParams]);

  // Reset reloads page to /gallery with no params
  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, setFilters, resetFilters };
}

function parseIntOrNull(value: string | null): number | null {
  if (value == null) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
```

### 5.7 Paginated Artworks Hook — `src/hooks/usePaginatedArtworks.ts`

A lower-level hook for fetching artworks from an array of IDs with pagination. Used by both the gallery and related
works.

```
// usePaginatedArtworks.ts

imports: useQueries from @tanstack/react-query
imports: getObject from @/api/endpoints
imports: transformRawObject from @/transformers/artwork
imports: Artwork from @/types/artwork

interface UsePaginatedArtworksParams {
  objectIds: number[]
  enabled?: boolean
}

interface UsePaginatedArtworksResult {
  artworks: Artwork[]         // Only resolved artworks (no undefined)
  pendingCount: number        // How many are still loading
  isLoading: boolean          // Any artwork still loading
  errors: Error[]             // Any errors encountered
}

function usePaginatedArtworks({ objectIds, enabled = true }): UsePaginatedArtworksResult {
  queries = useQueries({
    queries: objectIds.map(id => ({
      queryKey: ['artwork', id],
      queryFn: async () => {
        raw = await getObject(id)
        return transformRawObject(raw)
      },
      staleTime: 10 * 60 * 1000,
      enabled,
    })),
  })

  artworks = queries
    .filter(q => q.data != null)
    .map(q => q.data as Artwork)

  pendingCount = queries.filter(q => q.isLoading).length
  errors = queries
    .filter(q => q.error != null)
    .map(q => q.error as Error)

  return { artworks, pendingCount, isLoading: pendingCount > 0, errors }
}
```

### 5.8 Related Works Hook — `src/features/artwork/useRelatedWorks.ts`

```
// useRelatedWorks.ts

imports: useQuery from @tanstack/react-query
imports: searchObjects from @/api/endpoints
imports: useDepartments from @/hooks/useDepartments
imports: usePaginatedArtworks from @/hooks/usePaginatedArtworks
imports: findDepartmentId from @/utils/departments
imports: Artwork from @/types/artwork

const RELATED_WORKS_COUNT = 10
const YEAR_RANGE = 50

interface UseRelatedWorksParams {
  artwork: Artwork | undefined
}

function useRelatedWorks({ artwork }): UseRelatedWorksResult {
  departments = useDepartments().data

  // --- Step 1: Derive search parameters ---
  departmentId = (artwork && departments)
    ? findDepartmentId(artwork.department, departments)
    : null

  // Derive a search term from the artwork. Priority:
  // 1. classification (e.g., "Paintings", "Sculpture")
  // 2. culture (e.g., "Japanese", "French")
  // 3. objectName (e.g., "Hanging scroll", "Vase")
  // 4. department name (last resort)
  searchTerm = artwork
    ? (artwork.classification || artwork.culture || artwork.objectName || artwork.department)
    : null

  yearFrom = artwork?.year != null ? artwork.year - YEAR_RANGE : null
  yearTo   = artwork?.year != null ? artwork.year + YEAR_RANGE : null

  // --- Step 2: Search for related object IDs ---
  searchQuery = useQuery({
    queryKey: ['related-search', artwork?.id, departmentId, searchTerm, yearFrom, yearTo],
    queryFn: () => searchObjects({
      query: searchTerm!,
      departmentId: departmentId ?? undefined,
      dateBegin: yearFrom ?? undefined,
      dateEnd: yearTo ?? undefined,
      hasImages: true,
    }),
    enabled: artwork != null && searchTerm != null,
    staleTime: 10 * 60 * 1000,
  })

  // --- Step 3: Take first N IDs (excluding current artwork) ---
  relatedIds = (searchQuery.data?.objectIDs ?? [])
    .filter(id => id !== artwork?.id)
    .slice(0, RELATED_WORKS_COUNT)

  // --- Step 4: Fetch artwork details ---
  { artworks, isLoading: isLoadingArtworks } = usePaginatedArtworks({
    objectIds: relatedIds,
    enabled: relatedIds.length > 0,
  })

  return {
    relatedArtworks: artworks,
    isLoading: searchQuery.isLoading || isLoadingArtworks,
    isSearching: searchQuery.isLoading,
    totalFound: searchQuery.data?.total ?? 0,
  }
}
```

---

## 6. Zustand Store

### 6.1 Collected Store — `src/store/collectedStore.ts`

```
import { create } from 'zustand';

interface CollectedState {
  collectedIds: Set<number>;
  toggleCollected: (id: number) => void;
  isCollected: (id: number) => boolean;
  collectedCount: () => number;
}

export const useCollectedStore = create<CollectedState>((set, get) => ({
  collectedIds: new Set<number>(),

  toggleCollected: (id: number) => {
    set(state => {
      const next = new Set(state.collectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { collectedIds: next };
    });
  },

  isCollected: (id: number) => {
    return get().collectedIds.has(id);
  },

  collectedCount: () => {
    return get().collectedIds.size;
  },
}));
```

**Note on Set serialization**: Zustand with `Set` works fine for in-memory session state. If we later need
`localStorage` persistence, we'd need to add a custom serializer. For now, session-only is correct per the spec.

---

## 7. Component Contracts

### 7.1 UI Primitives

#### `Skeleton` — `src/components/ui/Skeleton.tsx`

Props:

```
interface SkeletonProps {
  className?: string;
}
```

Renders a pulsing placeholder div with Tailwind's `animate-pulse bg-gray-200 rounded`. The `className` prop controls
dimensions.

#### `ImageWithFallback` — `src/components/ui/ImageWithFallback.tsx`

Props:

```
interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode; // defaults to a placeholder icon
}
```

Behavior:

- If `src` is null → render fallback immediately
- If `src` loads → render `<img>`
- If `src` errors (broken URL) → render fallback
- Use `onError` handler on the `<img>` tag, with local `useState` to track error state

#### `YearDisplay` — `src/components/ui/YearDisplay.tsx`

Props:

```
interface YearDisplayProps {
  year: number | null;
  yearEnd?: number | null;
  dateDisplay?: string | null;
}
```

Behavior:

- If `dateDisplay` is available → show it (human-readable: "ca. 1796")
- Else if `year` is available → show formatted year (see `formatYear` in utils)
- Else → show "Date unknown"

#### `LoadMoreButton` — `src/components/ui/LoadMoreButton.tsx`

Props:

```
interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}
```

Renders a centered button. Disabled when loading. Hidden when no more results.

#### `ErrorMessage` — `src/components/ui/ErrorMessage.tsx`

Props:

```
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}
```

### 7.2 Artwork Components

#### `ArtworkCard` — `src/components/artwork/ArtworkCard.tsx`

Props:

```
interface ArtworkCardProps {
  artwork: Artwork;
}
```

Layout:

```
┌─────────────────────┐
│                     │
│   Image / Fallback  │  ← aspect-ratio: 4/3, object-cover
│                     │
├─────────────────────┤
│ Title               │  ← truncate to 2 lines
│ Artist Name         │  ← "Unknown Artist" if null
│ Date                │  ← YearDisplay component
│ ♡ Collected toggle  │  ← heart icon, uses collectedStore
└─────────────────────┘
```

- Entire card is wrapped in `<Link to={/artwork/${artwork.id}}>` (except the collected toggle)
- Collected toggle uses `useCollectedStore().toggleCollected(artwork.id)`
- Collected toggle's click event calls `e.preventDefault()` and `e.stopPropagation()` to prevent navigation

#### `ArtworkGrid` — `src/components/artwork/ArtworkGrid.tsx`

Props:

```
interface ArtworkGridProps {
  artworks: (Artwork | undefined)[];  // undefined slots render skeletons
  isLoading?: boolean;
}
```

Layout:

- CSS Grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
- For each slot:
    - If `artwork` is defined → render `<ArtworkCard>`
    - If `artwork` is undefined → render skeleton card (same dimensions)

### 7.3 Layout Components

#### `Header` — `src/components/layout/Header.tsx`

```
┌────────────────────────────────────────────────────────┐
│  🏛️ Museum Intelligence    [Gallery]    ♡ Collected(3) │
└────────────────────────────────────────────────────────┘
```

- Logo/title links to `/gallery`
- "Gallery" nav link
- Collected count badge reads from `useCollectedStore().collectedCount()`

#### `Layout` — `src/components/layout/Layout.tsx`

```
interface LayoutProps {
  children: React.ReactNode;
}
```

- Renders `<Header />` + `<main>{children}</main>`
- Main area has max-width container, horizontal padding

---

## 8. Page Composition

### 8.1 Gallery Page — `src/features/gallery/GalleryPage.tsx`

Composes:

```
<Layout>
  <h1>Research Gallery</h1>
  <p>Total results: {totalResults}</p>
  <GalleryFilters />
  <ArtworkGrid artworks={artworks} />
  <LoadMoreButton />
</Layout>
```

State:

- `page` — local state (`useState`), starts at 0
- Filters come from `useGalleryFilters()`
- Data comes from `useGallerySearch({ filters, page })`
- "Load More" increments `page`
- When filters change, reset `page` to 0

### 8.2 Gallery Filters — `src/features/gallery/GalleryFilters.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 [Search keyword...        ]                              │
│                                                             │
│ Department: [All Departments ▼]                              │
│                                                             │
│ Date Range: From [____] BCE/CE   To [____] BCE/CE           │
│                                                             │
│ [Reset Filters]                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Keyword search**: `<input>` with debounce (300ms). On change → `setFilters({ query })`.
- **Department**: `<select>` populated from `useDepartments()`. On change → `setFilters({ departmentId })`.
- **Date range**: Two number inputs for `fromYear` and `toYear`. Negative values = BCE. Inputs accept negative numbers.
- **Reset**: Calls `resetFilters()` from `useGalleryFilters`.

**Debounce strategy for keyword**: Use a local `useState` for the input value. On change, update local state
immediately (responsive typing). Use a `useEffect` with a 300ms timeout to sync to URL params.

### 8.3 Artwork Detail Page — `src/features/artwork/ArtworkDetailPage.tsx`

Route: `/artwork/:objectID`

Composes:

```
<Layout>
  <BackLink to="/gallery">← Back to Gallery</BackLink>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div>
      <ImageWithFallback src={artwork.imageLarge} />
    </div>
    <div>
      <ArtworkMeta artwork={artwork} />
      <CollectedToggle artworkId={artwork.id} />
    </div>
  </div>
  <RelatedWorks artwork={artwork} />
</Layout>
```

State:

- `objectID` from `useParams()`
- Artwork data from `useArtwork(objectID)`
- Loading → skeleton layout
- Error → error message with retry

### 8.4 Artwork Meta — `src/features/artwork/ArtworkMeta.tsx`

Props:

```
interface ArtworkMetaProps {
  artwork: Artwork;
}
```

Layout (museum catalog style):

```
Title                           ← text-3xl font-serif
Artist Name                     ← text-xl, or "Unknown Artist"

────────────────────────────
Accession Number    67.241
Medium              Oil on canvas
Dimensions          16 x 20 in. (40.6 x 50.8 cm)
Department          European Paintings
Date                ca. 1796
Credit Line         Robert Lehman Collection, 1975
────────────────────────────

Tags: [Birds] [Nature] [Landscape]    ← pill badges
```

Each metadata row: if value is null, skip the row entirely (don't show "Medium: —").

### 8.5 Related Works — `src/features/artwork/RelatedWorks.tsx`

Props:

```
interface RelatedWorksProps {
  artwork: Artwork;
}
```

Layout:

```
Related Works
─────────────
← [Card] [Card] [Card] [Card] [Card] [Card] →
   ← horizontal scroll, snap to cards →
```

- Uses `useRelatedWorks({ artwork })`
- Horizontal scrollable container: `overflow-x-auto flex gap-4 snap-x`
- Each card is a compact version of ArtworkCard (smaller, fixed width ~200px)
- If no related works found → show "No related works found" message
- Loading state → horizontal row of skeleton cards

---

## 9. Routing

### 9.1 Route Configuration — in `App.tsx`

```
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/gallery" replace />} />
    <Route path="/gallery" element={<GalleryPage />} />
    <Route path="/artwork/:objectId" element={<ArtworkDetailPage />} />
    <Route path="*" element={<Navigate to="/gallery" replace />} />
  </Routes>
</BrowserRouter>
```

- `/` redirects to `/gallery`
- Unknown routes redirect to `/gallery`
- No nested routing needed

---

## 10. Performance Strategy

### 10.1 Summary Table

| Technique                  | Where                                | Impact                                              |
| -------------------------- | ------------------------------------ | --------------------------------------------------- |
| **Client-side pagination** | Gallery search                       | Only fetch 20 objects at a time, not thousands      |
| **Parallel fetching**      | `useQueries` in usePaginatedArtworks | All 20 objects fetch simultaneously                 |
| **Progressive rendering**  | ArtworkGrid                          | Cards appear individually as each resolves          |
| **React Query caching**    | All hooks                            | Navigate away and back = instant, no refetch        |
| **Request deduplication**  | React Query default                  | Same artwork ID never fetched twice simultaneously  |
| **`hasImages=true`**       | All gallery searches                 | Avoid fetching objects with no displayable image    |
| **Stale-while-revalidate** | Query config                         | Show cached data immediately, refresh in background |
| **Skeleton loading**       | ArtworkGrid, detail page             | Layout stability, no content shift                  |
| **Debounced search input** | GalleryFilters                       | Avoid rapid API calls while typing                  |

### 10.2 Cache Strategy

| Data                 | Cache Key                 | Stale Time | GC Time |
| -------------------- | ------------------------- | ---------- | ------- |
| Search results       | `['search', filters]`     | 5 min      | 30 min  |
| Individual artwork   | `['artwork', id]`         | 10 min     | 30 min  |
| Departments          | `['departments']`         | 30 min     | 60 min  |
| Related works search | `['related-search', ...]` | 10 min     | 30 min  |

### 10.3 Why NOT Infinite Scroll

Infinite scroll requires:

- Intersection Observer setup
- Scroll position restoration on back navigation
- Virtualization for large lists (otherwise DOM nodes accumulate)

"Load More" is simpler, more accessible, and sufficient for an interview project. I can mention infinite scroll as a
production enhancement during the review.

---

## 11. Test Specifications

### 11.1 Transformer Tests — `src/__tests__/transformers/artwork.test.ts`

```
describe('transformRawObject')
  ✓ transforms a complete valid object
  ✓ handles empty artistDisplayName → null
  ✓ handles missing title → "Untitled"
  ✓ handles objectBeginDate of 0 → null year
  ✓ handles negative objectBeginDate (BCE dates)
  ✓ handles null tags → empty array
  ✓ handles tags with empty terms → filters them out
  ✓ handles empty string fields → null
  ✓ handles whitespace-only strings → null
  ✓ preserves valid non-empty fields
  ✓ extracts tag terms from tag objects

describe('emptyToNull')
  ✓ returns null for empty string
  ✓ returns null for whitespace string
  ✓ returns null for null input
  ✓ returns null for undefined input
  ✓ returns trimmed string for valid input

describe('extractTags')
  ✓ extracts terms from valid tag array
  ✓ returns empty array for null
  ✓ returns empty array for empty array
  ✓ filters out tags with empty terms
```

### 11.2 Utility Tests — `src/__tests__/utils/date.test.ts`

```
describe('formatYear')
  ✓ formats positive year as CE: 1200 → "1200 CE"
  ✓ formats negative year as BCE: -500 → "500 BCE"
  ✓ formats year 0 as "1 BCE" (there is no year 0 historically)
  ✓ returns "Date unknown" for null
  ✓ handles year 1 as "1 CE"
  ✓ handles large negative years: -3000 → "3000 BCE"

describe('formatYearRange')
  ✓ formats same year: (1200, 1200) → "1200 CE"
  ✓ formats range: (1200, 1250) → "1200–1250 CE"
  ✓ formats BCE range: (-500, -450) → "500–450 BCE"
  ✓ formats cross-era range: (-100, 100) → "100 BCE – 100 CE"
  ✓ handles null values gracefully
```

### 11.3 Schema Tests — `src/__tests__/api/schemas.test.ts`

```
describe('rawMetObjectSchema')
  ✓ parses a valid complete object
  ✓ applies defaults for missing optional fields
  ✓ handles null tags field
  ✓ passes through unknown fields without error
  ✓ requires objectID to be a number

describe('searchResponseSchema')
  ✓ parses valid search response
  ✓ handles null objectIDs (no results)
  ✓ defaults null objectIDs to null (not empty array — schema uses .default(null))

describe('departmentsResponseSchema')
  ✓ parses valid departments response
```

### 11.4 Hook Tests — `src/__tests__/hooks/useGallerySearch.test.ts`

These tests require mocking the API endpoints. Use `vi.mock('@/api/endpoints')`.

```
describe('useGallerySearch')
  ✓ returns empty state when search returns no IDs
  ✓ fetches artworks for the first page of IDs
  ✓ returns hasMore=true when more IDs exist beyond current page
  ✓ returns hasMore=false when all IDs are fetched
  ✓ handles search error gracefully
  ✓ uses hasImages=true in search params
  ✓ includes departmentId when filter is set
  ✓ includes date range when both fromYear and toYear are set
```

### 11.5 Related Works Hook Tests — `src/__tests__/hooks/useRelatedWorks.test.ts`

```
describe('useRelatedWorks')
  ✓ derives search term from artwork classification
  ✓ falls back to culture when classification is null
  ✓ falls back to objectName when culture is null
  ✓ falls back to department when all else is null
  ✓ excludes current artwork from results
  ✓ limits results to 10
  ✓ uses ±50 year range from artwork year
  ✓ returns empty when artwork has no year
  ✓ disabled when artwork is undefined
```

### 11.6 Test Fixtures

Create `src/__tests__/fixtures/` with:

- `rawObject.ts` — a complete valid RawMetObject fixture
- `rawObjectMinimal.ts` — a RawMetObject with many empty/null fields
- `searchResponse.ts` — a SearchResponse with 50 IDs
- `departments.ts` — the full departments list

---

## 12. README Template

The README should follow this structure:

```
# Museum Intelligence Dashboard

A research-oriented dashboard for discovering and analyzing artworks
from the Metropolitan Museum of Art, built as a frontend engineering
technical challenge.

## Architecture Overview

-- Diagram: Data flow from API > Zod > Transformer > React Query > Components
-- Explain the layered architecture and separation of concerns

## Getting Started

-- npm install, npm run dev, npm test

## Data Normalization Strategy

-- Explain the transformer layer, why it exists, key transformation rules
-- Highlight the Zod validation at the API boundary

## API Request Strategy

-- Explain the two-step fetch pattern
-- Explain client-side pagination of IDs
-- Explain parallel fetching with useQueries
-- Explain progressive rendering

## State Management

-- Three state categories: server (React Query), URL (searchParams), client (Zustand)
-- Explain why each category uses its specific tool

## Performance Optimizations

-- List all optimizations from Section 10
-- Explain caching strategy

## Key Design Decisions

-- Why "Load More" over infinite scroll
-- Why Zod at the boundary
-- Why separate transformer layer
-- How related works engine derives search terms

## AI Tools Usage

-- Brief honest description of how AI tools were used during development
```

---

## 13. Implementation Order

Execute in this exact order. Each step builds on the previous.

| Step | What                                                                   | Depends On      | Estimated Effort |
| ---- | ---------------------------------------------------------------------- | --------------- | ---------------- |
| 1    | Project scaffold (Vite, deps, configs)                                 | Nothing         | 15 min           |
| 2    | Types (`types/artwork.ts`, `types/api.ts`)                             | Step 1          | 10 min           |
| 3    | Utils (`utils/date.ts`, `utils/image.ts`, `utils/constants.ts`)        | Step 2          | 15 min           |
| 4    | API layer (`api/client.ts`, `api/schemas.ts`, `api/endpoints.ts`)      | Steps 2-3       | 30 min           |
| 5    | Transformers (`transformers/artwork.ts`, `transformers/department.ts`) | Steps 2, 4      | 20 min           |
| 6    | Tests for transformers + utils + schemas                               | Steps 3-5       | 30 min           |
| 7    | Zustand store (`store/collectedStore.ts`)                              | Step 2          | 10 min           |
| 8    | Hooks (`useDepartments`, `useArtwork`, `usePaginatedArtworks`)         | Steps 4-5       | 20 min           |
| 9    | UI primitives (Skeleton, ImageWithFallback, YearDisplay, etc.)         | Steps 2-3       | 30 min           |
| 10   | Layout + routing (Header, Layout, App.tsx)                             | Step 9          | 20 min           |
| 11   | ArtworkCard + ArtworkGrid                                              | Steps 7-9       | 30 min           |
| 12   | Gallery page + useGallerySearch + useGalleryFilters                    | Steps 8, 11     | 45 min           |
| 13   | GalleryFilters component                                               | Step 12         | 25 min           |
| 14   | Artwork detail page + ArtworkMeta                                      | Steps 8, 9      | 30 min           |
| 15   | Related works (useRelatedWorks + RelatedWorks component)               | Steps 8, 11, 14 | 30 min           |
| 16   | Hook tests (useGallerySearch, useRelatedWorks)                         | Steps 12, 15    | 30 min           |
| 17   | README                                                                 | Everything      | 20 min           |

**Total estimated: ~6 hours** (aligned with the spec's 4-6 hour target, including thinking time)

---

## Appendix A: Utilities

### `src/utils/date.ts`

```
formatYear(year: number | null): string
  - formatYear(1200)   → "1200 CE"
  - formatYear(-500)   → "500 BCE"
  - formatYear(null)   → "Date unknown"
  - formatYear(0)      → "1 BCE"

formatYearRange(from: number | null, to: number | null): string
  - formatYearRange(1200, 1250) → "1200–1250 CE"
  - formatYearRange(-500, -450) → "500–450 BCE"
  - formatYearRange(-100, 100)  → "100 BCE – 100 CE"
```

### `src/utils/image.ts`

```
/** Placeholder image URL for artworks with no image */
export const PLACEHOLDER_IMAGE_URL = '/placeholder-artwork.svg';
// OR use a data URI or a simple gray placeholder component
```

### `src/utils/constants.ts`

```
export const API_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
export const PAGE_SIZE = 20;
export const RELATED_WORKS_COUNT = 10;
export const RELATED_WORKS_YEAR_RANGE = 50;
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;
export const ARTWORK_STALE_TIME = 10 * 60 * 1000;
export const DEPARTMENTS_STALE_TIME = 30 * 60 * 1000;
export const SEARCH_DEBOUNCE_MS = 300;
```

### `src/utils/departments.ts`

```
findDepartmentId(departmentName: string, departments: Department[]): number | null
  - Case-insensitive match against departments list
  - Returns null if not found
```

---

## Appendix B: Key API Observations

1. **`/search` requires `q` parameter** — cannot do department+date-only searches. Must always provide a search term.

2. **`objectIDs` can be `null`** — when no results match, the API returns `{ total: 0, objectIDs: null }` (not an empty
   array).

3. **`tags` can be `null`** — not an empty array when no tags exist.

4. **`objectBeginDate` uses `0` for unknown** — many objects have `objectBeginDate: 0` which doesn't mean "year 0".
   Treat as null.

5. **Rate limit is 80 req/s** — at 20 parallel fetches per page load, we're well within limits.

6. **No CORS issues** — the API allows cross-origin requests.

7. **Images may 404** — even when `primaryImageSmall` has a URL, the image may not exist. Handle with `onError`
   fallback.

8. **Department endpoint returns 19 departments** — small enough to fetch once and cache.
