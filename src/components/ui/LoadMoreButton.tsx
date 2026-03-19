import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface LoadMoreButtonProps {
    onClick: () => void;
    isLoading: boolean;
    hasMore: boolean;
}

export function LoadMoreButton({onClick, isLoading, hasMore}: LoadMoreButtonProps) {
    if (!hasMore) return null;

    return (
        <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
            <Button variant='contained' onClick={onClick} disabled={isLoading} sx={{minWidth: 150}}>
                {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Load More'}
            </Button>
        </Box>
    );
}
