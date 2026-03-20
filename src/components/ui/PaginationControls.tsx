import {memo} from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';

interface PaginationControlsProps {
    /** Current page (0-indexed internally, displayed as 1-indexed) */
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const PaginationControls = memo(function PaginationControls({
    page,
    totalPages,
    onPageChange,
    isLoading = false,
}: PaginationControlsProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (totalPages <= 1) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                py: 4,
            }}
        >
            <Pagination
                // MUI Pagination is 1-indexed, our state is 0-indexed
                page={page + 1}
                count={totalPages}
                onChange={(_event, value) => onPageChange(value - 1)}
                disabled={isLoading}
                color='primary'
                size={isMobile ? 'small' : 'medium'}
                showFirstButton
                showLastButton
                // On mobile: show only current page with first/last buttons (no siblings/boundaries)
                // On desktop: show 1 sibling on each side + 1 boundary page
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 0 : 1}
            />
            <Typography variant='caption' color='text.secondary'>
                Page {page + 1} of {totalPages.toLocaleString()}
            </Typography>
        </Box>
    );
});
