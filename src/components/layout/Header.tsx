import {memo} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MuseumIcon from '@mui/icons-material/Museum';
import {useCollectedStore} from '@/store/collectedStore';

export const Header = memo(function Header() {
    const collectedCount = useCollectedStore((s) => s.collectedIds.size);

    return (
        <AppBar position='sticky'>
            <Container maxWidth='lg'>
                <Toolbar disableGutters sx={{height: 64}}>
                    <Link
                        component={RouterLink}
                        to='/gallery'
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.primary',
                            '&:hover': {color: 'text.secondary'},
                        }}
                    >
                        <MuseumIcon />
                        <Typography
                            variant='h6'
                            component='span'
                            sx={{fontWeight: 600, display: {xs: 'none', sm: 'inline'}}}
                        >
                            Museum Intelligence
                        </Typography>
                    </Link>

                    <Box sx={{flexGrow: 1}} />

                    <Box component='nav' sx={{display: 'flex', alignItems: 'center', gap: 3}}>
                        <Link
                            component={RouterLink}
                            to='/gallery'
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                '&:hover': {color: 'text.primary'},
                            }}
                        >
                            Gallery
                        </Link>
                        <Link
                            component={RouterLink}
                            to='/collected'
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                '&:hover': {color: 'text.primary'},
                            }}
                        >
                            <Badge badgeContent={collectedCount} color='error' max={99}>
                                <FavoriteIcon fontSize='small' sx={{color: 'error.main'}} />
                            </Badge>
                        </Link>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
});
