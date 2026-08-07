import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /**
     * Service worker.
     *
     * The bug this fixes: an installed iOS home-screen app kept serving an old
     * index.html after a deploy even though Safari picked the update up. The SW
     * puts navigations on NetworkFirst so the HTML shell is always revalidated,
     * and skipWaiting/clientsClaim mean the new bundle takes over as soon as it
     * is accepted rather than waiting for every tab to close.
     *
     * registerType is 'prompt', not 'autoUpdate': she may be mid-way through
     * logging a series at the alley, and yanking the page out from under her to
     * reload is worse than a banner she taps when ready.
     */
    VitePWA({
      registerType: 'prompt',
      // The hand-written public/manifest.webmanifest stays the source of truth.
      manifest: false,
      includeAssets: [
        'icon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'favicon-48.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Firebase's 613 kB SDK chunk sails past the 2 MiB default anyway, but
        // be explicit so a future asset does not silently drop out of precache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // The shell. NetworkFirst is the actual fix — the cache is only a
            // fallback for being offline at the lanes.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'anchorchet-html',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Hashed assets are immutable, so serving from cache while
            // refreshing in the background costs nothing and feels instant.
            urlPattern: ({ request }) =>
              ['script', 'style', 'font', 'image'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'anchorchet-assets',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // Firestore and Google auth must never be intercepted: the SDK does its
        // own offline persistence and a cached auth response would be a bug.
        navigateFallbackDenylist: [/^\/__/, /firestore/, /googleapis/],
      },
      devOptions: { enabled: false },
    }),
  ],
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
