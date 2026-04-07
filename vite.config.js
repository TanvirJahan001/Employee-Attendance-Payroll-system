import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  build: {
    // Target modern browsers for smaller, faster output
    target: 'esnext',
    // Drop console.log and debugger calls in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Split vendor libraries into separately cacheable chunks
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/vue-chartjs')) return 'vendor-chart';
          if (id.includes('node_modules/primevue') || id.includes('node_modules/@primevue')) return 'vendor-primevue';
          if (id.includes('node_modules/primeflex') || id.includes('node_modules/primeicons')) return 'vendor-prime-assets';
          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia') || id.includes('node_modules/vue-router')) return 'vendor-vue';
          if (id.includes('node_modules')) return 'vendor-misc';
        },
        // Use content-hash filenames for effective long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },

  // Remove console and debugger statements from production build
  esbuild: {
    drop: ['console', 'debugger'],
  },

  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
})
