import {Component, type ReactNode} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary to catch rendering errors in child components.
 * Displays a user-friendly error message with retry option.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {hasError: false, error: null};
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {hasError: true, error};
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null});
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                        textAlign: 'center',
                        p: 4,
                    }}
                >
                    <Typography variant='h5' gutterBottom>
                        Something went wrong
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{mb: 3, maxWidth: 400}}>
                        An unexpected error occurred. Please try refreshing the page.
                    </Typography>
                    <Button variant='contained' startIcon={<RefreshIcon />} onClick={this.handleRetry}>
                        Try Again
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}
