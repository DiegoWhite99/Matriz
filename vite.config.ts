import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages sirve el sitio bajo /<repositorio>/, no en la raíz. El workflow
 * de Pages pasa esa ruta en BASE_PATH; Firebase Hosting sirve en la raíz y no
 * la define, así que `npm run build` y `npm run deploy:hosting` no cambian.
 */
const basePath = process.env.BASE_PATH || '/'

export default defineConfig({
  base: basePath.endsWith('/') ? basePath : `${basePath}/`,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Firebase y Recharts cambian mucho menos que el código de la app:
        // separarlos deja el chunk de la app pequeño entre despliegues.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          charts: ['recharts'],
        },
      },
    },
  },
})
