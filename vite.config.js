import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages alt dizinden yayınlandığı için base yolu repo adıdır.
// WKWebView, capacitor:// şeması altında crossorigin işaretli modülleri
// yüklemeyi reddedebiliyor ve sonuç siyah ekran oluyor. Native derlemede
// bu özniteliği kaldırıyoruz; aynı kaynaktan yüklendiği için gereği yok.
function stripCrossorigin() {
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(?:="[^"]*")?/g, '');
    },
  };
}

const isNativeBuild = process.env.VITE_BASE === './';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/BudgetPlanner/',
  plugins: isNativeBuild ? [react(), stripCrossorigin()] : [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
  },
});
