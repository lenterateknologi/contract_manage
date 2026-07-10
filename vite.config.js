import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {
    defineConfig
} from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
                            return 'vendor-react';
                        }
                        if (id.includes('node_modules/@inertiajs/')) {
                            return 'vendor-inertia';
                        }
                        if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('node_modules/@xyflow/')) {
                            return 'vendor-flow';
                        }
                        if (id.includes('node_modules/lucide-react/')) {
                            return 'vendor-icons';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },
});