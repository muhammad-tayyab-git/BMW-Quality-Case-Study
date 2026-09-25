import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser calls /api/ai-investigation. Vite proxies that request to the
// small Node server so the LLM API key never enters the React bundle.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
