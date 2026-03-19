# Museum Intelligence Dashboard - Agent Instructions

## Project Overview

A React-based museum intelligence dashboard that integrates with the **Metropolitan Museum of Art API**. Users can browse, search, filter, and collect artworks from the Met's collection of 470K+ objects.

**Live API**: `https://collectionapi.metmuseum.org/public/collection/v1`

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.x |
| Language | TypeScript (strict mode) | 5.9+ |
| Build | Vite | 7.x |
| Server State | TanStack React Query | 5.x |
| Client State | Zustand | 5.x |
| URL State | React Router DOM | 7.x |
| Validation | Zod | 3.x |
| UI | Material UI (MUI) | 7.x |
| Testing | Vitest + Testing Library | 3.x |

## Project Structure

```
src/
├── api/                    # API layer
│   ├── client.ts           # HTTP client with retry, timeout, abort
│   ├── endpoints.ts        # API functions (search, getObject, getDepartments)
│   ├── requestQueue.ts     # Concurrency limiter (8 max, 15ms delay)
│   └── schemas.ts          # Zod schemas for API validation
│
├── components/
│   ├── artwork/            # ArtworkCard, ArtworkGrid, ArtworkStatusCard
│   ├── layout/             # Header, Layout
│   └── ui/                 # Reusable primitives (ErrorMessage, Pagination, etc.)
│
├── features/               # Feature modules (co-located components + hooks)
│   ├── artwork/            # Detail page, RelatedWorks
│   ├── collected/          # Collected artworks page
│   └── gallery/            # Main gallery with filters
│
├── hooks/                  # Shared hooks (useArtwork, useDepartments, useGalleryFilters)
├── store/                  # Zustand stores (collectedStore with localStorage)
├── transformers/           # Raw API -> Domain model transformers
├── types/                  # TypeScript types (Artwork, GalleryFilters, etc.)
├── utils/                  # Utilities (constants, errors, date formatting)
├── __tests__/              # Tests mirroring src structure
│   └── fixtures/           # Shared test data
│
├── App.tsx                 # Root with routing + QueryClient setup
├── main.tsx                # Entry point
└── theme.ts                # MUI theme
```

## Architecture Patterns

### Data Flow
```
Components → React Query Hooks → Transformers → API Layer → Met API
                                      ↑
                              Zod validation
```

### State Management
- **Server state**: TanStack React Query (caching, background refetch)
- **URL state**: React Router searchParams (filters are bookmarkable)
- **Client state**: Zustand + localStorage (collected artworks)

### API Patterns
- **Two-step fetch**: Search returns IDs only, then parallel fetch objects
- **Request queue**: 8 concurrent max, 15ms delay between requests
- **Retry with backoff**: 1s, 2s, 4s delays for 5xx and 403 (rate limit)
- **Abortable requests**: All fetches support AbortSignal cancellation
- **Race condition protection**: Tagged search results with filtersKey

### Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add/modify filters | `src/hooks/useGalleryFilters.ts`, `src/features/gallery/GalleryFilters.tsx` |
| Change search logic | `src/features/gallery/useGallerySearch.ts`, `src/api/endpoints.ts` |
| Modify API client | `src/api/client.ts`, `src/api/requestQueue.ts` |
| Add new API endpoint | `src/api/endpoints.ts`, `src/api/schemas.ts` |
| Transform API data | `src/transformers/artwork.ts` |
| Error handling | `src/utils/errors.ts`, `src/App.tsx` (QueryClient config) |
| Caching config | `src/utils/constants.ts` |

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Type-check + production build
npm run typecheck    # TypeScript only
npm run lint         # ESLint
npm run format       # Prettier format
npm test             # Run tests once
npm run test:watch   # Tests in watch mode
```

## Code Conventions

### Style
- **4-space indentation**
- **Single quotes** (including JSX)
- **No bracket spacing**: `{foo}` not `{ foo }`
- **Trailing commas** everywhere
- **120 char line width**

### Naming
- Components: `PascalCase`, named exports, memo-wrapped
- Hooks: `use` prefix (e.g., `useGallerySearch`)
- Types: `PascalCase` interfaces
- Constants: `SCREAMING_SNAKE_CASE`

### Component Pattern
```tsx
export const MyComponent = memo(function MyComponent({prop}: MyComponentProps) {
    // ...
});
```

### Error Handling
- `ApiError` class with `status` and `url` properties
- 404 → "unavailable" card (grey, BlockIcon)
- 403 → "restricted" card (yellow/warning, LockIcon)
- `isSkippableError()`, `isNotFoundError()`, `isForbiddenError()` guards
- Error checks use duck typing (`hasHttpStatus`) as fallback to handle production edge cases where `instanceof` may fail

## Important Implementation Details

### Met API Rate Limiting
- Limit: 80 requests/second
- 403 = rate limited (retry with backoff) OR restricted artwork (don't retry)
- Search/departments: `retryOn403: true`
- Individual artworks: no retry on 403

### Request Queue (`src/api/requestQueue.ts`)
- Max 8 concurrent requests
- 15ms delay between requests
- `clear()` method to abort pending requests on filter change

### Race Condition Prevention (`src/features/gallery/useGallerySearch.ts`)
- Search results tagged with `filtersKey` at fetch time
- `isSearchStale` check prevents using old IDs
- `cancelArtworkRequests()` clears queue + cancels in-flight on filter change

### Caching Times (`src/utils/constants.ts`)
| Data | Stale Time | GC Time |
|------|------------|---------|
| Search | 5 min | 30 min |
| Artworks | 10 min | 30 min |
| Departments | 30 min | 60 min |

### Vite Proxy (dev only)
```
/api/* → https://collectionapi.metmuseum.org/public/collection/v1/*
```

## Testing

### Structure
```
src/__tests__/
├── api/schemas.test.ts           # Zod validation
├── hooks/useGallerySearch.test.tsx
├── transformers/artwork.test.ts
├── utils/date.test.ts
└── fixtures/                     # Shared test data
```

### Patterns
- Mock API with `vi.mock('@/api/endpoints')`
- Wrap hooks with `QueryClientProvider`
- Use `waitFor` for async assertions
- Fixtures in `__tests__/fixtures/`

## Common Issues & Solutions

### 403 Forbidden on Search
- Cause: Rate limiting from too many concurrent requests
- Solution: Requests are queued and retried with exponential backoff

### 403 vs 404 on Individual Artworks
- **404**: Artwork doesn't exist (removed from collection) → Show "Unavailable" card
- **403**: Rate limiting (NOT restricted access - Met API returns all public objects in search) → Show "Restricted" card
- Note: In production builds, `instanceof ApiError` may fail across module boundaries. Error checks use duck typing as fallback.

### Stale Artwork IDs After Filter Change
- Cause: Race condition between filter change and search completion
- Solution: `filtersKey` tagging + `isSearchStale` check

### Date Range Not Working with Other Filters
- Cause: Closure capturing stale values
- Solution: Compute date range INSIDE queryFn, not outside

### Heart Button Not Toggling (Collected State)
- Cause: Using Zustand's `get().isCollected()` method doesn't trigger re-renders
- Solution: Select the `collectedIds` Set directly: `useCollectedStore((s) => s.collectedIds)`

## API Reference

### Search Objects
```
GET /search?q={query}&departmentId={id}&dateBegin={year}&dateEnd={year}&hasImages=true&isHighlight=true
Response: { total: number, objectIDs: number[] | null }
```

### Get Object
```
GET /objects/{objectID}
Response: { objectID, title, artistDisplayName, ... }
```

### Get Departments
```
GET /departments
Response: { departments: [{ departmentId, displayName }] }
```

## Skills to Load

When working on this project, consider loading:
- `typescript-patterns` - for TypeScript conventions
- `react-patterns` - for React component patterns
- `testing-strategy` - when writing tests
