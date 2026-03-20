import {memo} from 'react';
import type {ReactNode} from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import {Header} from './Header';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = memo(function Layout({children}: LayoutProps) {
    return (
        <Box sx={{minHeight: '100vh', bgcolor: 'background.default'}}>
            <Link
                href='#main-content'
                sx={{
                    position: 'absolute',
                    left: '-9999px',
                    zIndex: 9999,
                    padding: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    textDecoration: 'none',
                    '&:focus': {
                        left: 0,
                        top: 0,
                    },
                }}
            >
                Skip to main content
            </Link>
            <Header />
            <Container component='main' id='main-content' maxWidth='lg' sx={{py: 4}}>
                {children}
            </Container>
        </Box>
    );
});
