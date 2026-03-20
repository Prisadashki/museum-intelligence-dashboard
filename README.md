# Museum Intelligence Dashboard

A research-oriented dashboard for discovering and analyzing artworks from the Metropolitan Museum of Art.

**Live Demo**: [museum-intelligence-dashboard.vercel.app](https://museum-intelligence-dashboard.vercel.app)

## Prerequisites

- Node.js >= 20

## Getting started

1. Install dependencies:

    ```bash
    npm ci
    ```

2. Start the development server:

    ```bash
    npm run dev
    ```

    The application is available at `http://localhost:5173`.

If you have issues installing, try removing `package-lock.json` and running `npm install` instead.

## Usage

The application has three main pages:

- **Gallery** (`/gallery`) - Search and browse the Met's collection with filters for department, date range, and highlights
- **Artwork detail** (`/artwork/:id`) - View full artwork information with related works suggestions
- **Collected** (`/collected`) - View artworks you've saved by clicking the heart icon

### Search behavior

The search uses the Met Museum's keyword-based search API:

- Searches are debounced (400ms) to reduce API calls while typing
- Results always include `hasImages=true` for consistent display
- Department, date range, and highlights filters can be combined with search

### Collecting artworks

Click the heart icon on any artwork card to add it to your collection. Collections are stored in browser memory (session only).

## Configuration

The application proxies API requests through Vite's dev server to avoid CORS issues:

| Route    | Target                                                       |
| -------- | ------------------------------------------------------------ |
| `/api/*` | `https://collectionapi.metmuseum.org/public/collection/v1/*` |

No environment variables are required for development.

## Install dependencies

```bash
npm ci
```

This installs all dependencies from `package-lock.json` and verifies consistency with `package.json`.

## Build

```bash
npm run build       # Type check and build for production
npm run preview     # Preview the production build locally
```

The build output is written to the `dist/` directory.

## Type check, lint, and test

```bash
npm run typecheck   # Run TypeScript type checker
npm run lint        # Run ESLint
npm test            # Run all tests once
npm run test:watch  # Run tests in watch mode
```

For more details see `package.json` file.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Components                                  │
│   (GalleryPage, ArtworkDetailPage, ArtworkCard, RelatedWorks, etc.)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                         React Query Hooks                                │
│     (useGallerySearch, useArtwork, useRelatedWorks, useDepartments)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                          Transformer Layer                               │
│            (transformRawObject, transformDepartments)                    │
│              Raw API shapes → Clean domain models                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                            API Layer                                     │
│                 (client.ts, schemas.ts, endpoints.ts)                    │
│       Zod validation, retry logic, request queue rate limiting          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
                      Metropolitan Museum of Art API
```

**Key design decisions:**

- **Zod at the API boundary**: Runtime validation catches API changes early and provides type inference
- **Transformer layer**: Separates raw API shapes from clean domain models for testability
- **Request queue**: Limits concurrent requests (8 max) with 15ms delays to stay under the Met API's 80 req/s limit
- **Retry with backoff**: Automatically retries 403 (rate limit) and 5xx errors with exponential backoff
- **URL state**: Filters are stored in URL search params for shareable/bookmarkable searches
- **Zustand for collections**: Session-only client state without context provider boilerplate

## API request strategy

The Met API search endpoint returns only object IDs, requiring a two-step fetch:

1. **Search**: `GET /search?q=sunflowers` returns `{ total: 97, objectIDs: [1, 2, 3, ...] }`
2. **Fetch**: Individual `GET /objects/{id}` requests for each artwork

We handle this with:

- **Client-side pagination**: Store all IDs, slice for current page (20 per page)
- **Parallel fetching**: `useQueries` fetches all visible artworks simultaneously
- **Progressive rendering**: Cards appear as each artwork resolves
- **Prefetching**: Next page is prefetched in the background for instant transitions

## Cache configuration

| Data               | Stale time | GC time | Purpose                                 |
| ------------------ | ---------- | ------- | --------------------------------------- |
| Search results     | 5 min      | 30 min  | Balance freshness with reduced requests |
| Individual artwork | 10 min     | 30 min  | Artworks rarely change                  |
| Departments        | 30 min     | 60 min  | Static reference data                   |

## Tech stack

- React 19 + TypeScript 5 (strict mode)
- Vite 7 (dev server with API proxy)
- TanStack Query (server state, caching)
- Zustand (client state)
- React Router 7 (routing, URL state)
- MUI 7 (Material UI components)
- Zod (runtime schema validation)
- Vitest + Testing Library (55 tests)

## Architectural Choices

### Why This Stack?

**React Query over Redux/Context for server state**: The Met API's two-step fetch pattern (search returns IDs, then fetch each object) maps naturally to React Query's caching model. Each artwork has its own cache entry, enabling granular invalidation and background refetching without custom normalization logic.

**Zustand over Context for client state**: The collected artworks feature needed persistent state without the boilerplate of Context providers. Zustand's selector pattern (`useCollectedStore((s) => s.collectedIds.has(id))`) prevents the re-render cascade that would occur with Context when any collection changes.

**Zod at API boundaries**: The Met API occasionally returns unexpected shapes (null arrays, missing fields). Runtime validation with Zod catches these at the network layer, providing clear error messages instead of cryptic "cannot read property of undefined" errors deep in components.

**Transformer layer**: Separating raw API shapes from domain models allows components to work with clean, typed data (`artwork.year`) rather than API quirks (`rawObject.objectBeginDate`). This also makes testing straightforward—mock the transformer output, not the API.

**URL state for filters**: All gallery filters live in URL search params. This makes searches shareable, bookmarkable, and survives page refreshes. React Router's `useSearchParams` handles serialization.

### Performance Optimizations Applied

- **Granular Zustand selectors**: Components subscribe to specific values (e.g., `collectedIds.has(id)`) rather than entire store slices, preventing unnecessary re-renders
- **memo() on all components**: Every component is wrapped with `React.memo()` to skip re-renders when props haven't changed
- **AbortSignal propagation**: All `queryFn` implementations receive and forward `signal` for proper request cancellation on unmount or filter changes
- **Request queue with rate limiting**: Concurrent requests capped at 8 with 15ms delays to stay under the Met API's 80 req/s limit
- **Prefetching**: Next page artworks are prefetched in the background for instant pagination

### Accessibility

- Skip link for keyboard navigation
- `aria-live` regions for dynamic content announcements
- `aria-label` on icon-only buttons and navigation elements
- Keyboard-accessible horizontal scroll carousels

## AI Collaboration Experience

This project was developed in collaboration with Claude (Anthropic), using an iterative pair-programming approach.

### What Worked Well

**Architecture discussions**: AI excelled at explaining trade-offs between different approaches (e.g., React Query vs Redux, Zustand selectors vs Context). Having a knowledgeable collaborator to discuss patterns before implementing saved significant refactoring time.

**Performance audits**: The AI systematically identified optimization opportunities across the codebase—missing `memo()` wrappers, subscription anti-patterns, missing `AbortSignal` propagation—that would have been tedious to find manually.

**Boilerplate generation**: Repetitive tasks like adding `memo()` to 15+ components, updating test assertions for new function signatures, or creating consistent component structures were handled efficiently.

**Code review perspective**: Getting immediate feedback on potential issues (e.g., "sorting only the page window would break pagination") prevented bugs before they were introduced.

### What Required Human Judgment

**Domain decisions**: Choosing what features to build, prioritizing user experience trade-offs, and deciding when "good enough" was acceptable required human context about project goals.

**Visual design**: Layout decisions, spacing, color choices, and overall aesthetic required human taste and iteration in the browser.

**Testing strategy**: Deciding what to test, at what level, and what edge cases matter required understanding the actual risk profile of different code paths.

### Workflow

1. **Discuss approach**: Explain the goal, discuss options, agree on a plan
2. **Implement incrementally**: AI writes code, human reviews and requests adjustments
3. **Verify continuously**: Run builds and tests after each change
4. **Audit periodically**: Request comprehensive audits to catch accumulated issues

The AI maintained context across long sessions, remembering previous decisions and constraints. This continuity made it feel like working with a colleague who had been on the project from the start.
