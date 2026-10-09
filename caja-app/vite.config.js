import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // basicSsl + host:true (igual que Taxi-PE): el servidor de pruebas
  // sirve por https también en la IP de la red local (ej.
  // https://192.168.1.52:5174). Sin "contexto seguro" el navegador
  // bloquea el portapapeles (Copiar boleta) y la cámara. El certificado
  // es autofirmado: la primera vez hay que aceptarlo a mano. No afecta
  // a Vercel, que ya sirve por https.
  // Modo "pane" (vista previa del panel de Claude, ver
  // .claude/launch.json): sin https — el panel no acepta certificados
  // autofirmados — y en el puerto que le asigna (PORT).
  plugins: mode === 'pane' ? [react()] : [react(), basicSsl()],
  server: {
    host: true,
    ...(process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {}),
  },
}))
