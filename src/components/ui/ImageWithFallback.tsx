import {memo, useState} from 'react';
import Box from '@mui/material/Box';
import {PLACEHOLDER_IMAGE} from '@/utils/image';

interface ImageWithFallbackProps {
    src: string | null;
    alt: string;
    aspectRatio?: string;
    objectFit?: 'cover' | 'contain';
}

export const ImageWithFallback = memo(function ImageWithFallback({
    src,
    alt,
    aspectRatio = '4/3',
    objectFit = 'cover',
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    aspectRatio,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    component='img'
                    src={PLACEHOLDER_IMAGE}
                    alt=''
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.6,
                    }}
                />
            </Box>
        );
    }

    return (
        <Box
            component='img'
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            loading='lazy'
            decoding='async'
            sx={{
                width: '100%',
                height: '100%',
                objectFit,
            }}
        />
    );
});
