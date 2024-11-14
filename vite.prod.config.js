import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import { version } from './build-version.json';

// https://vitejs.dev/config/
export default defineConfig({
    root: './prod',
    base: './',
    build: {
        assetsDir: './',
        target: 'es2019',
        rollupOptions: {
            input: {
                appSchoool: fileURLToPath(
                    new URL('./prod/chat.html', import.meta.url)
                ),
            },
        },
    },
    esbuild: {
        target: 'es2019',
    },
    define: {
        VERSION: JSON.stringify(`prod:${version}`),
    },
});
