import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist/electron',
            sourcemap: true,
            rollupOptions: {
              external: ['electron', 'sqlite3', 'winreg', 'node-fetch']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist/electron',
            sourcemap: true,
            rollupOptions: {
              external: ['electron']
            },
            format: 'cjs'
          }
        }
      }
    ]),
    renderer()
  ],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/dist/**"]
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
