import {lazy, Suspense, memo} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider, QueryCache} from '@tanstack/react-query';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import {theme} from './theme';
import {isSkippableError} from '@/utils/errors';
import {ErrorBoundary} from '@/components/ui/ErrorBoundary';

// Lazy load route components for code splitting
const GalleryPage = lazy(() => import('@/features/gallery/GalleryPage').then((m) => ({default: m.GalleryPage})));
const ArtworkDetailPage = lazy(() =>
    import('@/features/artwork/ArtworkDetailPage').then((m) => ({default: m.ArtworkDetailPage})),
);
const CollectedPage = lazy(() =>
    import('@/features/collected/CollectedPage').then((m) => ({default: m.CollectedPage})),
);

const PageLoader = memo(function PageLoader() {
    return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'}}>
            <CircularProgress />
        </Box>
    );
});

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        // Suppress console logging for expected API errors (404/403).
        // These are handled gracefully in the UI as "Unavailable" / "Restricted" cards.
        // By providing an onError handler that does nothing for skippable errors,
        // we prevent React Query from logging them to the console.
        onError: (error) => {
            // Silently ignore 404/403 errors - they're expected and handled in UI
            if (isSkippableError(error)) return;
            // For unexpected errors, we could log them here, but we choose not to
            // since they're already visible in the UI error boundaries
        },
    }),
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            // Never retry 404/403 — these are definitive responses, not transient failures.
            // For all other errors, retry once.
            retry: (failureCount, error) => {
                if (isSkippableError(error)) return false;
                return failureCount < 1;
            },
            // Disable throwing errors to error boundaries for expected errors
            throwOnError: (error) => {
                // Only throw to error boundary for unexpected errors
                return !isSkippableError(error);
            },
        },
    },
});

/**
 * Wraps a lazy-loaded route with ErrorBoundary and Suspense.
 * This ensures chunk loading failures are caught and displayed gracefully.
 */
function LazyRoute({element}: {element: React.ReactNode}) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>{element}</Suspense>
        </ErrorBoundary>
    );
}

export function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<Navigate to='/gallery' replace />} />
                        <Route path='/gallery' element={<LazyRoute element={<GalleryPage />} />} />
                        <Route path='/artwork/:objectId' element={<LazyRoute element={<ArtworkDetailPage />} />} />
                        <Route path='/collected' element={<LazyRoute element={<CollectedPage />} />} />
                        <Route path='*' element={<Navigate to='/gallery' replace />} />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
