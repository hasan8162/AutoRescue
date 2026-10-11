import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  daisyui: {
    themes: ["light"], // Restricts it to only the light theme
  },
  server: {
    host: true, // Listens on all addresses (0.0.0.0)
    allowedHosts: true, // Allows ngrok tunnel hosts
  },
})
