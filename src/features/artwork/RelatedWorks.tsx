import {Link as RouterLink} from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import {ImageWithFallback} from '@/components/ui/ImageWithFallback';
import {YearDisplay} from '@/components/ui/YearDisplay';
import {useRelatedWorks} from './useRelatedWorks';
import type {Artwork} from '@/types/artwork';

interface RelatedWorksProps {
    artwork: Artwork;
}

function RelatedCardSkeleton() {
    return (
        <Card sx={{width: 200, flexShrink: 0}}>
            <Skeleton variant='rectangular' sx={{aspectRatio: '4/3'}} />
            <CardContent>
                <Skeleton variant='text' width='75%' />
                <Skeleton variant='text' width='50%' />
            </CardContent>
        </Card>
    );
}

interface RelatedCardProps {
    artwork: Artwork;
}

function RelatedCard({artwork}: RelatedCardProps) {
    return (
        <Card
            sx={{
                width: 200,
                flexShrink: 0,
                transition: 'box-shadow 0.2s',
                '&:hover': {boxShadow: 3},
            }}
        >
            <CardActionArea component={RouterLink} to={`/artwork/${artwork.id}`}>
                <CardMedia sx={{aspectRatio: '4/3', bgcolor: 'grey.100'}}>
                    <ImageWithFallback src={artwork.imageSmall} alt={artwork.title} />
                </CardMedia>
                <CardContent>
                    <Typography
                        variant='body2'
                        fontWeight={500}
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            mb: 0.5,
                        }}
                    >
                        {artwork.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' noWrap component='p'>
                        {artwork.artist ?? 'Unknown Artist'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                        <YearDisplay year={artwork.year} dateDisplay={artwork.dateDisplay} />
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export function RelatedWorks({artwork}: RelatedWorksProps) {
    const {relatedArtworks, isLoading, totalFound} = useRelatedWorks(artwork);

    return (
        <Box component='section' sx={{mt: 6}}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Typography variant='h2'>Related Works</Typography>
                {totalFound > 0 && !isLoading && (
                    <Typography variant='body2' color='text.secondary'>
                        {totalFound.toLocaleString()} found
                    </Typography>
                )}
            </Box>

            <Divider sx={{mb: 2}} />

            {isLoading ? (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 2,
                    }}
                >
                    {Array.from({length: 5}).map((_, i) => (
                        <RelatedCardSkeleton key={i} />
                    ))}
                </Box>
            ) : relatedArtworks.length === 0 ? (
                <Typography variant='body2' color='text.secondary' sx={{textAlign: 'center', py: 4}}>
                    No related works found
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 2,
                        scrollSnapType: 'x mandatory',
                        '& > *': {scrollSnapAlign: 'start'},
                    }}
                >
                    {relatedArtworks.map((related) => (
                        <RelatedCard key={related.id} artwork={related} />
                    ))}
                </Box>
            )}
        </Box>
    );
}
