
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    allowedHosts: ['host.docker.internal'],

    headers: {
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' http://localhost:* ws://localhost:*; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'",

      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',

      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',

      'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  },
})
