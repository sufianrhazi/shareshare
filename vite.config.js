import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    build: {
        assetsDir: './',
        target: 'es2019',
    },
    esbuild: {
        target: 'es2019',
    },
    define: {
        VERSION: '"dev"',
    },
});
