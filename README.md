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
- Vitest + Testing Library (54 tests)
