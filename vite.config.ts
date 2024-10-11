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
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
        },
      },
    },
  },
  plugins: [
    react(),
    dts({ rollupTypes: true, tsconfigPath: './tsconfig.build.json' }),
  ],
});
