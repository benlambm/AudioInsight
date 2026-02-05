import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const OUTPUT_DIR = path.resolve(__dirname, 'output');

function localSavePlugin(): Plugin {
  return {
    name: 'local-save',
    configureServer(server) {
      server.middlewares.use('/api/save-analysis', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { analysis, fileName } = JSON.parse(body);
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            const safeName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const runDir = path.join(OUTPUT_DIR, `${timestamp}_${safeName}`);

            fs.mkdirSync(runDir, { recursive: true });
            fs.writeFileSync(path.join(runDir, 'analysis.json'), JSON.stringify(analysis, null, 2));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ path: runDir }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), localSavePlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
