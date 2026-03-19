import {createTheme} from '@mui/material/styles';

/**
 * Museum Intelligence Dashboard MUI theme.
 * Clean, sophisticated museum aesthetic with neutral tones.
 */
export const theme = createTheme({
    palette: {
        primary: {
            main: '#1a1a1a',
            light: '#4a4a4a',
            dark: '#000000',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#757575',
            light: '#a4a4a4',
            dark: '#494949',
            contrastText: '#ffffff',
        },
        error: {
            main: '#d32f2f',
            light: '#ef5350',
            dark: '#c62828',
        },
        success: {
            main: '#2e7d32',
            light: '#4caf50',
            dark: '#1b5e20',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a1a1a',
            secondary: '#757575',
        },
        grey: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 600,
            fontSize: '2rem',
        },
        h2: {
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h3: {
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.125rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '0.875rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        caption: {
            fontSize: '0.75rem',
            color: '#757575',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    minHeight: '100vh',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                },
            },
            defaultProps: {
                disableElevation: true,
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small',
                variant: 'outlined',
            },
        },
        MuiSelect: {
            defaultProps: {
                size: 'small',
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    boxShadow: 'none',
                    borderBottom: '1px solid #e0e0e0',
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                    '&:hover': {
                        textDecoration: 'none',
                    },
                },
            },
        },
    },
});
