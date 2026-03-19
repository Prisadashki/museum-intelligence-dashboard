import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
                    'vendor-query': ['@tanstack/react-query'],
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://collectionapi.metmuseum.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/public/collection/v1'),
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
