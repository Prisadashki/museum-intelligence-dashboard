import {lazy, Suspense} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider, QueryCache} from '@tanstack/react-query';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import {theme} from './theme';
import {isSkippableError} from '@/utils/errors';

// Lazy load route components for code splitting
const GalleryPage = lazy(() => import('@/features/gallery/GalleryPage').then((m) => ({default: m.GalleryPage})));
const ArtworkDetailPage = lazy(() =>
    import('@/features/artwork/ArtworkDetailPage').then((m) => ({default: m.ArtworkDetailPage})),
);
const CollectedPage = lazy(() => import('@/features/collected/CollectedPage').then((m) => ({default: m.CollectedPage})));

function PageLoader() {
    return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'}}>
            <CircularProgress />
        </Box>
    );
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        // Suppress console logging for expected API errors (404/403).
        // These are handled gracefully in the UI as "Unavailable" / "Restricted" cards.
        onError: (error) => {
            if (!isSkippableError(error)) {
                console.error('Query error:', error);
            }
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
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path='/' element={<Navigate to='/gallery' replace/>}/>
                            <Route path='/gallery' element={<GalleryPage/>}/>
                            <Route path='/artwork/:objectId' element={<ArtworkDetailPage/>}/>
                            <Route path='/collected' element={<CollectedPage/>}/>
                            <Route path='*' element={<Navigate to='/gallery' replace/>}/>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
