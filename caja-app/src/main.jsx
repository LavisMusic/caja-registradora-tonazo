import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import CatalogPage from './pages/CatalogPage'
import ErrorBoundary from './components/ErrorBoundary'
import SuperAdminAccessPage from './pages/SuperAdminAccessPage.jsx'
import NegocioAccessPage from './pages/NegocioAccessPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
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
