import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // host:true lets you open the dev server from an iPhone / iPad on the same wifi
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    // The firebase chunk is ~614 kB raw / ~180 kB gzipped. That is the SDK's
    // own floor, it is split out and cached separately, and warning about it on
    // every build is just noise.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // The Firebase SDK is the bulk of the bundle and changes far less often
        // than app code, so it gets its own long-lived chunk instead of being
        // re-downloaded on every deploy.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/]@?firebase/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
