import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  // viteSingleFile：把 JS/CSS 全部内联进 dist/index.html，
  // 产物可直接双击（file:// 协议）打开使用，无需任何服务器
  plugins: [inspectAttr(), react(), viteSingleFile()],
  server: {
    port: 5173,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
