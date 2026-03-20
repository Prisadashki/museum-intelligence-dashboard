import {memo} from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import {ArtworkCard} from './ArtworkCard';
import {ArtworkStatusCard} from './ArtworkStatusCard';
import type {ArtworkSlot} from '@/types/artwork';

interface ArtworkGridProps {
    slots: ArtworkSlot[];
    isLoading?: boolean;
}

const ArtworkCardSkeleton = memo(function ArtworkCardSkeleton() {
    return (
        <Card sx={{height: '100%'}}>
            <Skeleton variant='rectangular' sx={{aspectRatio: '4/3'}} />
            <CardContent>
                <Skeleton variant='text' width='75%' />
                <Skeleton variant='text' width='50%' />
                <Skeleton variant='text' width='33%' />
            </CardContent>
        </Card>
    );
});

export const ArtworkGrid = memo(function ArtworkGrid({slots, isLoading}: ArtworkGridProps) {
    if (!isLoading && slots.length === 0) {
        return (
            <Box sx={{textAlign: 'center', py: 8}}>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                    No artworks found
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Try adjusting your search or filters
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {slots.map((slot) => {
                const key = slot.status === 'loaded' ? slot.artwork.id : slot.id;

                return (
                    <Grid size={{xs: 12, md: 4}} key={key}>
                        {slot.status === 'loaded' ? (
                            <ArtworkCard artwork={slot.artwork} />
                        ) : slot.status === 'unavailable' ? (
                            <ArtworkStatusCard id={slot.id} variant='unavailable' />
                        ) : slot.status === 'restricted' ? (
                            <ArtworkStatusCard id={slot.id} variant='restricted' />
                        ) : (
                            <ArtworkCardSkeleton />
                        )}
                    </Grid>
                );
            })}
        </Grid>
    );
});
