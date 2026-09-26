import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import CatalogPage from './pages/CatalogPage'
import RequireAdmin from './components/RequireAdmin'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.jsx'
import SuperAdminPanel from './pages/SuperAdminPanel.jsx'

// /admin es UNA sola ruta para las 4 sesiones de personal (RequireAdmin
// ya filtró "hay sesión válida de admin/cajero/super_admin"), pero
// super_admin monta una pantalla COMPLETAMENTE distinta (SuperAdminPanel)
// en vez de App.jsx — no comparte nada de la lógica de POS, así que
// separarla acá (antes de que monten los hooks de App.jsx) es más
// simple que meter un guard adentro de un componente de 10000+ líneas.
function StaffPanel() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <SuperAdminPanel /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <StaffPanel />
                </RequireAdmin>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
