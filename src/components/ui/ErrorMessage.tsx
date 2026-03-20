import {memo} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export const ErrorMessage = memo(function ErrorMessage({title = 'Error', message, onRetry}: ErrorMessageProps) {
    return (
        <Box sx={{textAlign: 'center', py: 6}}>
            <ErrorOutlineIcon sx={{fontSize: 48, color: 'error.main', mb: 2}} />
            <Typography variant='h6' color='error' gutterBottom>
                {title}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{mb: 3}}>
                {message}
            </Typography>
            {onRetry && (
                <Button variant='outlined' color='inherit' onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </Box>
    );
});
