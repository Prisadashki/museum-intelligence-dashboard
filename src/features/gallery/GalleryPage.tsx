import {useCallback} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {Layout} from '@/components/layout/Layout';
import {ArtworkGrid} from '@/components/artwork/ArtworkGrid';
import {PaginationControls} from '@/components/ui/PaginationControls';
import {ErrorMessage} from '@/components/ui/ErrorMessage';
import {GalleryFilters} from './GalleryFilters';
import {useGallerySearch} from './useGallerySearch';
import {useGalleryFilters} from '@/hooks/useGalleryFilters';

export function GalleryPage() {
    const {filters, page, setPage} = useGalleryFilters();
    const {artworkSlots, totalResults, totalPages, isSearching, isLoadingArtworks, error} = useGallerySearch({
        filters,
        page,
    });

    const handlePageChange = useCallback(
        (newPage: number) => {
            setPage(newPage);
            // Scroll to top of page on navigation for better UX
            window.scrollTo({top: 0, behavior: 'smooth'});
        },
        [setPage],
    );

    return (
        <Layout>
            <Box sx={{mb: 3}}>
                <Typography variant='h1' gutterBottom>
                    Research Gallery
                </Typography>
                {!isSearching && totalResults > 0 && (
                    <Typography variant='body2' color='text.secondary'>
                        {totalResults.toLocaleString()} artwork
                        {totalResults !== 1 ? 's' : ''} found
                    </Typography>
                )}
            </Box>

            <GalleryFilters />

            {error ? (
                <ErrorMessage
                    title='Search Error'
                    message={error.message || 'Failed to search artworks. Please try again.'}
                    onRetry={() => setPage(0)}
                />
            ) : isSearching ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        py: 10,
                    }}
                >
                    <CircularProgress size={48} />
                    <Typography variant='body1' color='text.secondary'>
                        Loading collection...
                    </Typography>
                </Box>
            ) : (
                <>
                    <ArtworkGrid slots={artworkSlots} isLoading={isLoadingArtworks} />
                    <PaginationControls
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoadingArtworks}
                    />
                </>
            )}
        </Layout>
    );
}
