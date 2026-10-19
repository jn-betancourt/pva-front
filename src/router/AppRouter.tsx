import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import { LoginPage } from '../pages/auth/LoginPage'
import { InventarioPage } from '../pages/inventario/InventarioPage'
import { OperariosPage } from '../pages/operarios/OperariosPage'
import { PosPage } from '../pages/pos/PosPage'
import { ReportesPage } from '../pages/reportes/ReportesPage'
import { TurnoPage } from '../pages/turno/TurnoPage'
import { VentasFacturasPage } from '../pages/ventas/VentasFacturasPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/pos" replace />
  }
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="turno" element={<TurnoPage />} />
        <Route path="ventas" element={<VentasFacturasPage />} />

        {/* Rutas exclusivas para rol ADMIN (RN-OPE-01 / RD-06) */}
        <Route
          path="inventario"
          element={
            <AdminRoute>
              <InventarioPage />
            </AdminRoute>
          }
        />
        <Route
          path="operarios"
          element={
            <AdminRoute>
              <OperariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="reportes"
          element={
            <AdminRoute>
              <ReportesPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  )
}
