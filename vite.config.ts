import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// @ts-expect-error: Type not available
import eslint from 'vite-plugin-eslint';
import { resolve } from 'path';
// import dts from 'vite-plugin-dts';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
  plugins: [
    vue(),
    eslint({
      include: ['src/**/*.js', 'src/**/*.vue', 'src/**/*.ts'],
      cache: false,
    }),
    // dts({ insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'dialog-vue',
      fileName: 'dialog-vue',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        inlineDynamicImports: true,
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
