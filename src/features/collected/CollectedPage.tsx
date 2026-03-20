import {memo} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import {Layout} from '@/components/layout/Layout';
import {ArtworkGrid} from '@/components/artwork/ArtworkGrid';
import {ErrorMessage} from '@/components/ui/ErrorMessage';
import {useCollectedArtworks} from './useCollectedArtworks';

const EmptyState = memo(function EmptyState() {
    return (
        <Box sx={{textAlign: 'center', py: 8}}>
            <PhotoLibraryIcon sx={{fontSize: 64, color: 'grey.400', mb: 2}} />
            <Typography variant='h5' gutterBottom>
                No artworks collected yet
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{mb: 3, maxWidth: 400, mx: 'auto'}}>
                Browse the gallery and click the heart icon on artworks you love to add them to your collection.
            </Typography>
            <Button component={RouterLink} to='/gallery' variant='contained' size='large'>
                Explore Gallery
            </Button>
        </Box>
    );
});

export const CollectedPage = memo(function CollectedPage() {
    const {artworkSlots, loadedCount, isLoading, isEmpty, error} = useCollectedArtworks();

    return (
        <Layout>
            <Box sx={{mb: 3}}>
                <Typography variant='h1' gutterBottom>
                    Collected Artworks
                </Typography>
                {!isEmpty && (
                    <Typography variant='body2' color='text.secondary'>
                        {loadedCount} artwork{loadedCount !== 1 ? 's' : ''} in your collection
                    </Typography>
                )}
            </Box>

            {error ? (
                <ErrorMessage title='Loading Error' message={error.message || 'Failed to load collected artworks.'} />
            ) : isEmpty ? (
                <EmptyState />
            ) : (
                <ArtworkGrid slots={artworkSlots} isLoading={isLoading} />
            )}
        </Layout>
    );
});
