import {
  BarChart3,
  Boxes,
  Lock,
  LogOut,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Store,
  Unlock,
  Users,
  Vault,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ApiTargetSelector } from '../ui/ApiTargetSelector'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useNetwork } from '../../context/NetworkContext'
import { useTurno } from '../../context/TurnoContext'
import { formatCOP } from '../../utils/formatters'

export function AppShell() {
  const { user, isAdmin, logout } = useAuth()
  const { turnoActivo, tieneTurnoAbierto } = useTurno()
  const { totalUnidades, totalAPagar } = useCart()
  const { isOnline } = useNetwork()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      {/* Barra de Estado Global Consistente (US-22, RN-OPE-04, Propiedad HCI #3) */}
      <header className="top-status-bar no-print">
        <div className="brand-block">
          <div className="brand-icon">
            <Store size={22} />
          </div>
          <div>
            <span className="brand-title">PuntoVenta Ágil</span>
            <span className="brand-subtitle">Sistema POS & Kardex</span>
          </div>
        </div>

        <div className="status-indicators">
          {/* Selector y Ping de Servidor Azure / Local */}
          <ApiTargetSelector compact />

          {/* Indicador de Conectividad (US-22 / RN-OFF-05) */}
          <div
            className={`status-pill ${isOnline ? 'status-online' : 'status-offline'}`}
            title={
              isOnline
                ? 'Conectado con el servidor central'
                : 'Modo Fuera de Línea detectado'
            }
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'En Línea' : 'Modo Offline'}</span>
          </div>

          {/* Indicador de Turno de Caja (US-04 / RN-OPE-04) */}
          <button
            type="button"
            className={`touch-target status-pill status-pill-button ${
              tieneTurnoAbierto ? 'status-shift-open' : 'status-shift-closed'
            }`}
            onClick={() => navigate('/turno')}
            title="Ir a Gestión de Gaveta / Turno de Caja"
          >
            {tieneTurnoAbierto ? <Unlock size={16} /> : <Lock size={16} />}
            <span>
              {tieneTurnoAbierto
                ? `Turno #${turnoActivo?.id_turno} Abierto`
                : 'Caja Cerrada (Abrir Turno)'}
            </span>
          </button>

          {/* Resumen rápido de Carrito activo */}
          {totalUnidades > 0 && (
            <button
              type="button"
              className="touch-target status-pill status-cart-summary"
              onClick={() => navigate('/pos')}
            >
              <ShoppingCart size={16} />
              <span>
                {totalUnidades} art. • {formatCOP(totalAPagar)}
              </span>
            </button>
          )}
        </div>

        <div className="user-session-block">
          <div className="user-info">
            <span className="user-name">{user?.nombre_completo}</span>
            <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-cashier'}`}>
              <ShieldCheck size={12} />
              {user?.rol}
            </span>
          </div>
          <button
            type="button"
            className="touch-target btn btn-outline-danger btn-logout"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
            <span className="hide-mobile">Salir</span>
          </button>
        </div>
      </header>

      <div className="shell-body">
        {/* Navegación Lateral con Metáforas del Mundo Real (Propiedad HCI #1 y #2) */}
        <aside className="sidebar-nav no-print" aria-label="Navegación principal del comercio">
          <nav className="nav-list">
            <div className="nav-section-title">Mostrador y Atención</div>

            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `touch-target nav-item ${isActive ? 'active' : ''}`
              }
            >
              <ShoppingCart size={20} />
              <div className="nav-item-text">
                <span className="nav-item-title">Mostrador POS</span>
                <span className="nav-item-desc">Cobro y Carrito</span>
              </div>
              {totalUnidades > 0 && (
                <span className="nav-CounterBadge">{totalUnidades}</span>
              )}
            </NavLink>

            <NavLink
              to="/turno"
              className={({ isActive }) =>
                `touch-target nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Vault size={20} />
              <div className="nav-item-text">
                <span className="nav-item-title">Gaveta y Turno</span>
                <span className="nav-item-desc">Apertura y Arqueo Ciego</span>
              </div>
            </NavLink>

            <NavLink
              to="/ventas"
              className={({ isActive }) =>
                `touch-target nav-item ${isActive ? 'active' : ''}`
              }
            >
              <ReceiptText size={20} />
              <div className="nav-item-text">
                <span className="nav-item-title">Ventas y Tickets</span>
                <span className="nav-item-desc">Facturas y Anulaciones</span>
              </div>
            </NavLink>

            {isAdmin && (
              <>
                <div className="nav-section-title">Administración (ADMIN)</div>

                <NavLink
                  to="/inventario"
                  className={({ isActive }) =>
                    `touch-target nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Boxes size={20} />
                  <div className="nav-item-text">
                    <span className="nav-item-title">Bodega y Kardex</span>
                    <span className="nav-item-desc">Catálogo, Compras y Mermas</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/operarios"
                  className={({ isActive }) =>
                    `touch-target nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Users size={20} />
                  <div className="nav-item-text">
                    <span className="nav-item-title">Operarios y PIN</span>
                    <span className="nav-item-desc">Personal y Desbloqueo</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/reportes"
                  className={({ isActive }) =>
                    `touch-target nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <BarChart3 size={20} />
                  <div className="nav-item-text">
                    <span className="nav-item-title">Balance y Cortes</span>
                    <span className="nav-item-desc">Métricas y Exportar CSV</span>
                  </div>
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Área de Trabajo Consistente */}
        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
