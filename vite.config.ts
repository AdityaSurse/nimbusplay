import { defineConfig, type Plugin } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import os from 'os';
import { resolve } from 'path';
import { RELAY_INTERNAL_PORT, VITE_DEV_PORT, WS_PATH } from './src/shared/constants.js';

function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function lanInfoPlugin(): Plugin {
  return {
    name: 'nimbus-lan-info',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/info') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            lanIp: getLanIp(),
            port: VITE_DEV_PORT
          }));
          return;
        }

        // Clean URL routing: map /controller to /controller/index.html
        if (req.url?.startsWith('/controller') && !req.url.startsWith('/controller/index.html')) {
          const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
          req.url = `/controller/index.html${query}`;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    basicSsl(),
    lanInfoPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: VITE_DEV_PORT,
    strictPort: true,
    proxy: {
      [WS_PATH]: {
        target: `ws://127.0.0.1:${RELAY_INTERNAL_PORT}`,
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        controller: resolve(__dirname, 'controller/index.html')
      }
    }
  }
});

