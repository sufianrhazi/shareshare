import fs from 'node:fs';
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
    server: {
        https: {
            key: fs.readFileSync('./localhost.key').toString(),
            cert: fs.readFileSync('./localhost.crt').toString(),
            ciphers:
                'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES256-SHA384',
            honorCipherOrder: true,
            secureProtocol: 'TLSv1_2_method',
        },
    },
});
