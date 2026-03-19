import {memo, useCallback} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {ImageWithFallback} from '@/components/ui/ImageWithFallback';
import {YearDisplay} from '@/components/ui/YearDisplay';
import {useCollectedStore} from '@/store/collectedStore';
import type {Artwork} from '@/types/artwork';

interface ArtworkCardProps {
    artwork: Artwork;
}

export const ArtworkCard = memo(function ArtworkCard({artwork}: ArtworkCardProps) {
    // Select the Set directly so component re-renders when it changes
    const collectedIds = useCollectedStore((s) => s.collectedIds);
    const toggleCollected = useCollectedStore((s) => s.toggleCollected);
    const collected = collectedIds.has(artwork.id);

    const handleToggleCollected = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollected(artwork.id);
        },
        [toggleCollected, artwork.id],
    );

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow: 3,
                },
            }}
        >
            <CardActionArea
                component={RouterLink}
                to={`/artwork/${artwork.id}`}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                }}
            >
                <CardMedia
                    sx={{
                        aspectRatio: '4/3',
                        bgcolor: 'grey.100',
                        overflow: 'hidden',
                    }}
                >
                    <ImageWithFallback src={artwork.imageSmall} alt={artwork.title} />
                </CardMedia>
                <CardContent sx={{flexGrow: 1}}>
                    <Typography
                        variant='body2'
                        fontWeight={500}
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 0.5,
                            lineHeight: 1.4,
                        }}
                    >
                        {artwork.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' noWrap component='p'>
                        {artwork.artist ?? 'Unknown Artist'}
                    </Typography>
                </CardContent>
            </CardActionArea>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    pb: 1.5,
                }}
            >
                <Typography variant='caption' color='text.secondary'>
                    <YearDisplay year={artwork.year} dateDisplay={artwork.dateDisplay} />
                </Typography>
                <IconButton
                    onClick={handleToggleCollected}
                    size='small'
                    aria-label={collected ? 'Remove from collection' : 'Add to collection'}
                    sx={{color: collected ? 'error.main' : 'grey.400'}}
                >
                    {collected ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
            </Box>
        </Card>
    );
});
