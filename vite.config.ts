import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1234,
    host: true
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/lab'],
          reactAdmin: ['react-admin']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
      'config': path.resolve(__dirname, './src/config'),
      'context': path.resolve(__dirname, './src/context'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'types': path.resolve(__dirname, './src/types'),
      'utilities': path.resolve(__dirname, './src/utilities'),
      'utils': path.resolve(__dirname, './src/utils.tsx'),
      'roundwareDataProvider': path.resolve(__dirname, './src/roundwareDataProvider')
    }
  },
  define: {
    // Ensure process.env is available for compatibility
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-admin',
      '@mui/material',
      '@mui/icons-material',
      '@mui/lab',
      '@mui/x-date-pickers',
      'react-router-dom',
      'react-query'
    ]
  }
})
