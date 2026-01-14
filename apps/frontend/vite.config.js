import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config with Vitest
export default defineConfig(({ mode }) => {
  // Use port 5500 for dev mode, 4273 for production
  const backendPort = mode === 'development' ? 5500 : 4273;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/__tests__/setup.js',
      include: ['src/__tests__/**/*.{test,spec}.{js,jsx}'],
    },
  };
})