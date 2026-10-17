import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const getBaseUrl = () => {
  const url = process.env.VITE_BASE_URL;
  if (!url || url.startsWith('postgres:') || url.startsWith('postgresql:')) {
    return '/';
  }
  if (url.startsWith('/')) {
    return url.endsWith('/') ? url : `${url}/`;
  }
  return '/';
};

export default defineConfig(() => {
  return {
    base: getBaseUrl(),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
  };
});
