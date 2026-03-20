import {memo} from 'react';
import type {ReactNode} from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import {Header} from './Header';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = memo(function Layout({children}: LayoutProps) {
    return (
        <Box sx={{minHeight: '100vh', bgcolor: 'background.default'}}>
            <Header />
            <Container component='main' maxWidth='lg' sx={{py: 4}}>
                {children}
            </Container>
        </Box>
    );
});
