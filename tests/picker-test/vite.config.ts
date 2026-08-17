import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: __dirname,
    plugins: [react()],
    resolve: {
        alias: { '@': 'C:/Users/lidya/Documents/DMMS/resources/js' },
    },
    server: { port: 5175, strictPort: true, host: '127.0.0.1' },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
});
