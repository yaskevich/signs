import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), Checker({ typescript: true })],
  server: {
    port: 3040,
    proxy: {
     '/api': {
       target: 'http://localhost:3041',
       changeOrigin: true,
       secure: false,
       ws: true,
     }
   }
  }
})
