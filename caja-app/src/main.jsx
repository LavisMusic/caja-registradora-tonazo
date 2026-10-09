import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import CatalogPage from './pages/CatalogPage'
import DirectorioPage from './pages/DirectorioPage.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import SuperAdminAccessPage from './pages/SuperAdminAccessPage.jsx'
import NegocioAccessPage from './pages/NegocioAccessPage.jsx'
import { instalarDespliegueBotones } from './lib/despliegueBotones'

// Botones de la cabecera: en el celular se despliegan manteniendo
// presionado (y deslizando por los demás).
instalarDespliegueBotones()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Fase 2: "/" ya no es la tienda de Tonazo — el directorio
                público de todos los negocios (grilla estilo Friv) vive
                en /directorio, y la tienda de cada uno en
                /directorio/:slug (pedido explícito: que el link quede
                "/directorio/tonazo"). "/" redirige para no dejar la
                raíz del dominio en un 404. */}
            <Route path="/" element={<Navigate to="/directorio" replace />} />
            <Route path="/directorio" element={<DirectorioPage />} />
            <Route path="/directorio/:slug" element={<CatalogPage />} />
            <Route path="/superadmin" element={<SuperAdminAccessPage />} />
            {/* /admin: alias del negocio Tonazo (mismo slug) — evita
                romper accesos directos ya guardados desde antes de la
                Fase 1 del super-admin, cuando /admin era la única
                puerta de entrada del personal. */}
            <Route path="/admin" element={<Navigate to="/tonazo" replace />} />
            <Route path="/:slug" element={<NegocioAccessPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
