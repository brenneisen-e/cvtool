import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          // Document processing libraries (large)
          'doc-processing': ['mammoth', 'jszip'],
          // Document generation libraries (very large)
          'doc-generation': ['docx', 'pptxgenjs'],
          // UI libraries
          'ui-vendor': ['lucide-react', 'react-dropzone'],
        },
      },
    },
    // Increase chunk size warning limit slightly
    chunkSizeWarningLimit: 600,
  },
})
