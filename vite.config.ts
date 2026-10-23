import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev: /api requests ko localhost:5000 (Node backend) pe bhejo
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
})
