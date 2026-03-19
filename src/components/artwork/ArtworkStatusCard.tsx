import {memo} from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';

interface ArtworkStatusCardProps {
    id: number;
    variant: 'unavailable' | 'restricted';
}

const CONFIG = {
    unavailable: {
        icon: BlockIcon,
        label: 'Unavailable',
        description: 'This artwork is no longer available in the collection.',
        bgColor: 'grey.100',
        iconColor: 'text.disabled',
    },
    restricted: {
        icon: LockIcon,
        label: 'Restricted',
        description: 'Access to this artwork is currently restricted.',
        bgColor: 'warning.50',
        iconColor: 'warning.main',
    },
} as const;

export const ArtworkStatusCard = memo(function ArtworkStatusCard({id, variant}: ArtworkStatusCardProps) {
    const {icon: Icon, label, description, bgColor, iconColor} = CONFIG[variant];

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.75,
            }}
        >
            <Box
                sx={{
                    aspectRatio: '4/3',
                    bgcolor: bgColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                }}
            >
                <Icon sx={{fontSize: 48, color: iconColor}} />
                <Typography variant='subtitle2' color='text.secondary'>
                    {label}
                </Typography>
            </Box>
            <CardContent sx={{flexGrow: 1}}>
                <Typography variant='body2' color='text.secondary' sx={{mb: 0.5, lineHeight: 1.4}}>
                    {description}
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                    ID: {id}
                </Typography>
            </CardContent>
        </Card>
    );
});
