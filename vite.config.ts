import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// @ts-expect-error: Type not available
import eslint from 'vite-plugin-eslint';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    eslint({
      // Activation du plugin ESLint
      include: ['src/**/*.js', 'src/**/*.vue', 'src/**/*.ts'],
      cache: false,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'dialog-vue',
      fileName: format => `dialog-vue.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
