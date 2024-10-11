import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/lib/main.ts'),
      name: 'react-webcam-rtc',
      fileName: (format) => `react-webcam-rtc.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'jotai'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'react-dom',
          jotai: 'jotai',
        },
      },
    },
  },
  plugins: [
    react(),
    dts({ tsconfigPath: './tsconfig.build.json', rollupTypes: true }),
  ],
});
