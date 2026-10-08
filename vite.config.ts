import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '.' em vez de process.cwd(): evita puxar @types/node só por isso — o fs do Node
  // resolve o caminho relativo do mesmo jeito.
  const env = loadEnv(mode, '.', '')
  const apiOrigin = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
    plugins: [
      vue(),
      VitePWA({
        // autoUpdate: SW novo assume sozinho no próximo load. Só precacheia o app shell;
        // chamadas à API (outra origem) nunca passam pelo cache.
        registerType: 'autoUpdate',
        // mode 'development' pula o terser do workbox, que morre no Termux/Android
        // ("Unexpected early exit ... (terser) renderChunk"). SW fica sem minificar (~poucos KB).
        workbox: { mode: 'development' },
        manifest: {
          name: 'Finager - Gestão Financeira Familiar',
          short_name: 'Finager',
          lang: 'pt-BR',
          start_url: '/',
          display: 'standalone',
          background_color: '#020617',
          theme_color: '#020617',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
      {
        // CSP via <meta>, só no build de produção: ainda não há servidor/proxy definido
        // para entregar como header HTTP, e via header seria mais forte (dá pra usar
        // frame-ancestors, que o <meta> ignora). No dev server o Vite HMR usa WebSocket/eval,
        // então o plugin não roda ali (apply: 'build') pra não quebrar `npm run dev`.
        // connect-src usa a mesma VITE_API_BASE_URL de sempre — muda sozinho por ambiente.
        name: 'inject-csp-meta',
        apply: 'build',
        transformIndexHtml(html) {
          const csp = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data:",
            `connect-src 'self' ${apiOrigin}`,
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join('; ')

          return html.replace(
            '<meta name="color-scheme" content="dark" />',
            `<meta name="color-scheme" content="dark" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
          )
        },
      },
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      allowedHosts: ['front.williampereira.dev.br'],
    },
  }
})
