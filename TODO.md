# Museum Intelligence Dashboard - TODO

## Bugs

- [ ] **Collections not persisted across sessions** - The README states collections are "session only" and stored in browser memory. Users lose their collected artworks when closing the browser. Should use `localStorage` for persistence (the Zustand store already has `localStorage` integration based on the architecture, but this may not be working as expected).

- [ ] **No offline handling** - When the API is unreachable, the app shows generic error states. Could improve with better offline detection and cached fallback data.

## Features

### High Priority

- [ ] **Artwork medium filter** - Add filter to search by artwork medium (painting, sculpture, photograph, etc.). The Met API supports `medium` parameter.

- [ ] **Geographic origin filter** - Add filter by geographic location/culture of origin. Useful for research.

- [ ] **Export collected artworks** - Allow users to export their collection as JSON/CSV for research purposes.

- [ ] **Share collection via URL** - Encode collected artwork IDs in URL params so users can share curated collections.

### Medium Priority

- [ ] **Sort options** - Add ability to sort search results (by date, relevance, etc.). Currently only default API ordering.

- [ ] **Infinite scroll option** - Alternative to pagination for users who prefer continuous browsing.

- [ ] **Image zoom/lightbox** - Full-screen image viewing with zoom capability on artwork detail page.

- [ ] **Related works improvements** - Current related works uses same department + artist. Could add:
  - Related by time period
  - Related by medium
  - Related by geographic origin

- [ ] **Search history** - Remember recent searches for quick re-access.

- [ ] **Advanced search** - Boolean operators, exact phrase matching, field-specific search (title only, artist only).

### Low Priority

- [ ] **Dark mode** - MUI theme supports dark mode, but it's not implemented.

- [ ] **Keyboard shortcuts** - Arrow keys for pagination, Enter to view selected artwork, etc.

- [ ] **Print-friendly view** - Optimized layout for printing artwork details.

- [ ] **Comparison view** - Side-by-side comparison of 2-4 artworks.

- [ ] **Timeline visualization** - Show collected artworks on a visual timeline by date.

## Technical Improvements

### Performance

- [ ] **Virtual scrolling for large result sets** - When search returns thousands of IDs, the ID array itself can be large. Consider virtual scrolling for the gallery grid.

- [ ] **Image lazy loading improvements** - Currently using browser native lazy loading. Could add intersection observer for more control.

- [ ] **Service worker for caching** - Add PWA support with service worker to cache static assets and API responses for offline viewing of previously loaded artworks.

### Code Quality

- [ ] **E2E tests** - Add Playwright or Cypress tests for critical user flows (search, filter, collect, navigate).

- [ ] **Accessibility audit** - Ensure WCAG 2.1 AA compliance. Add ARIA labels, keyboard navigation, screen reader testing.

- [ ] **Error boundary granularity** - Add more granular error boundaries so a single failed artwork doesn't affect the whole page.

- [ ] **Storybook** - Add component documentation with Storybook for design system consistency.

### Infrastructure

- [ ] **Production deployment** - Set up CI/CD pipeline and production hosting (Vercel, Netlify, etc.).

- [ ] **API proxy for production** - The Vite proxy only works in dev. Need a production solution (serverless function, dedicated proxy, or configure CORS).

- [ ] **Analytics** - Add usage analytics to understand which features are most used.

- [ ] **Error monitoring** - Add Sentry or similar for production error tracking.

## Documentation

- [ ] **API documentation** - Document the internal API layer (`client.ts`, `endpoints.ts`) for contributors.

- [ ] **Contributing guide** - Add CONTRIBUTING.md with setup instructions, code style, PR process.

- [ ] **Changelog** - Add CHANGELOG.md to track version history.

## Known Limitations

These are not bugs, but architectural limitations to be aware of:

1. **Met API search limitations** - The Met API search is basic keyword matching. No fuzzy search, no relevance ranking, no faceted search. These limitations are API-side and cannot be fixed client-side.

2. **No server-side rendering** - The app is client-side only. Not ideal for SEO if that becomes a requirement.

3. **Rate limiting is client-side only** - The 80 req/s limit handling works for single users but wouldn't scale for a shared proxy serving many users.

4. **No user accounts** - Collections are browser-local. No cross-device sync.
