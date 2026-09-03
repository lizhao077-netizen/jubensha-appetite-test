import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from /jubensha-appetite-test/ rather than
// from the domain root, so Vite must generate repository-relative URLs.
export default defineConfig({
  base: '/jubensha-appetite-test/',
  plugins: [react()],
  build: {
    // Covers current Android/iOS WeChat webviews without requiring an
    // additional legacy bundle.
    target: 'es2017',
  },
});
