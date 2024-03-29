import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Checker from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import UnheadVite from '@unhead/addons/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnheadVite(),
    VitePWA({
      registerType: 'autoUpdate', devOptions: {
        enabled: true
      }
    }),
    Checker({ typescript: true }),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()]
    })
  ],
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
