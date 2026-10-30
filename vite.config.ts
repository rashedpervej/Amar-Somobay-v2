import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

function fontSettingsPlugin() {
  return {
    name: 'font-settings-injector',
    transformIndexHtml(html: string) {
      try {
        const fontSettingsPath = path.resolve(__dirname, 'data/font_settings.json');
        if (fs.existsSync(fontSettingsPath)) {
          const content = JSON.parse(fs.readFileSync(fontSettingsPath, 'utf-8'));
          const font = content.bangla_font || 'solaimanlipi';
          return html.replace('<!-- FONT_SERVER_INJECT -->', `<script>window.__SERVER_BANGLA_FONT__ = ${JSON.stringify(font)};</script>`);
        }
      } catch (e) {
        console.error('Error in fontSettingsPlugin:', e);
      }
      return html.replace('<!-- FONT_SERVER_INJECT -->', `<script>window.__SERVER_BANGLA_FONT__ = "solaimanlipi";</script>`);
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [fontSettingsPlugin(), react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'motion/react': path.resolve(__dirname, './src/lib/motionShim.tsx'),
        'framer-motion': path.resolve(__dirname, './src/lib/motionShim.tsx'),
      },
    },
    server: {
      watch: {
        ignored: [path.resolve(__dirname, 'data/**'), '**/superadmin/**'],
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
