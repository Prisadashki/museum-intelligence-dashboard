import {Link as RouterLink, useParams} from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {Layout} from '@/components/layout/Layout';
import {ImageWithFallback} from '@/components/ui/ImageWithFallback';
import {ErrorMessage} from '@/components/ui/ErrorMessage';
import {ArtworkMeta} from './ArtworkMeta';
import {RelatedWorks} from './RelatedWorks';
import {useArtwork} from '@/hooks/useArtwork';
import {useCollectedStore} from '@/store/collectedStore';

function DetailSkeleton() {
    return (
        <Grid container spacing={4}>
            <Grid size={{xs: 12, lg: 6}}>
                <Skeleton variant='rectangular' sx={{aspectRatio: '1', width: '100%', borderRadius: 1}} />
            </Grid>
            <Grid size={{xs: 12, lg: 6}}>
                <Skeleton variant='text' width='75%' height={48} />
                <Skeleton variant='text' width='50%' height={32} />
                <Box sx={{mt: 4}}>
                    <Skeleton variant='text' width='100%' />
                    <Skeleton variant='text' width='100%' />
                    <Skeleton variant='text' width='75%' />
                    <Skeleton variant='text' width='66%' />
                </Box>
            </Grid>
        </Grid>
    );
}

export function ArtworkDetailPage() {
    const {objectId} = useParams<{objectId: string}>();
    const parsedId = objectId ? parseInt(objectId, 10) : 0;

    const {data: artwork, isLoading, error, refetch} = useArtwork(parsedId);
    // Select only the boolean for this specific artwork to avoid unnecessary re-renders
    const collected = useCollectedStore((s) => s.collectedIds.has(parsedId));
    const toggleCollected = useCollectedStore((s) => s.toggleCollected);

    return (
        <Layout>
            {/* Back Link */}
            <Button component={RouterLink} to='/gallery' startIcon={<ArrowBackIcon />} color='inherit' sx={{mb: 3}}>
                Back to Gallery
            </Button>

            {error ? (
                <ErrorMessage
                    title='Failed to Load Artwork'
                    message={error.message || 'Unable to load artwork details. Please try again.'}
                    onRetry={() => refetch()}
                />
            ) : isLoading || !artwork ? (
                <DetailSkeleton />
            ) : (
                <>
                    <Grid container spacing={4}>
                        {/* Image */}
                        <Grid size={{xs: 12, lg: 6}}>
                            <Box
                                sx={{
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <ImageWithFallback
                                    src={artwork.imageLarge}
                                    alt={artwork.title}
                                    aspectRatio='1'
                                    objectFit='contain'
                                />
                            </Box>
                        </Grid>

                        {/* Metadata */}
                        <Grid size={{xs: 12, lg: 6}}>
                            <ArtworkMeta artwork={artwork} />

                            {/* Collected Toggle */}
                            <Button
                                variant={collected ? 'contained' : 'outlined'}
                                color={collected ? 'error' : 'inherit'}
                                startIcon={collected ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                onClick={() => toggleCollected(artwork.id)}
                                sx={{mt: 3}}
                            >
                                {collected ? 'Remove from Collection' : 'Add to Collection'}
                            </Button>

                            {/* Public Domain Badge */}
                            {artwork.isPublicDomain && (
                                <Box sx={{mt: 2}}>
                                    <Chip label='Public Domain' color='success' size='small' variant='outlined' />
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    {/* Related Works */}
                    <RelatedWorks artwork={artwork} />
                </>
            )}
        </Layout>
    );
}
