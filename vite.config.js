import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => {
  const isDevelopment = command === 'serve';

  return {
    mode: isDevelopment ? 'development' : 'production',
    server: {
      open: true,
      proxy: {
        '/mysql': {
          target: 'http://localhost:7005',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:7005', // WebSocket 服务器地址
          ws: true, // 启用 WebSocket 代理
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        pages: path.resolve(__dirname, 'src/pages'),
        components: path.resolve(__dirname, 'src/components'),
        routes: path.resolve(__dirname, 'src/routes'),
        utils: path.resolve(__dirname, 'src/utils'),
      },
    },
    plugins: [react()],
    build: {
      outDir: 'chatroom',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        isDevelopment ? 'development' : 'production',
      ),
      'process.env.PUBLIC_PATH': JSON.stringify(
        isDevelopment ? '/public/' : '/',
      ),
    },
  };
});
