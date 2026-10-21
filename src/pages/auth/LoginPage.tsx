import { AlertTriangle, LockKeyhole, ShieldAlert, Store, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PvaApiError } from '../../api/httpClient'
import { ApiTargetSelector } from '../../components/ui/ApiTargetSelector'
import { TouchPinPad } from '../../components/ui/TouchPinPad'
import { useAuth } from '../../context/AuthContext'
import { useTurno } from '../../context/TurnoContext'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { refrescarTurnoActivo } = useTurno()
  const navigate = useNavigate()

  const [nombreUsuario, setNombreUsuario] = useState('admin')
  const [pin, setPin] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorInfo, setErrorInfo] = useState<{
    codigo: string
    mensaje: string
    detalle: string | null
  } | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/pos" replace />
  }

  const ejecutarLogin = async () => {
    if (!nombreUsuario.trim() || pin.length < 4) return
    setCargando(true)
    setErrorInfo(null)
    try {
      const resp = await login({
        nombre_usuario: nombreUsuario.trim(),
        pin,
      })
      await refrescarTurnoActivo()
      if (resp.turno_activo?.id_turno && resp.turno_activo.estado === 'ABIERTO') {
        navigate('/pos', { replace: true })
      } else {
        navigate('/turno', { replace: true })
      }
    } catch (err) {
      setPin('')
      if (err instanceof PvaApiError) {
        setErrorInfo({
          codigo: err.codigo,
          mensaje: err.message,
          detalle: err.detalle,
        })
      } else {
        setErrorInfo({
          codigo: 'ERR-LOGIN',
          mensaje: 'No fue posible iniciar sesión',
          detalle: err instanceof Error ? err.message : null,
        })
      }
    } finally {
      setCargando(false)
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void ejecutarLogin()
  }

  const esBloqueado = errorInfo?.codigo === 'AUTH-OPERARIO-BLOQUEADO'

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* Panel Informativo y de Metáfora Visual (Auto-descriptivo RNF-05) */}
        <section className="login-brand-panel">
          <div className="login-logo-badge">
            <Store size={36} />
          </div>
          <h1>PuntoVenta Ágil (PVA)</h1>
          <p className="login-lead">
            Sistema de Punto de Venta, Control de Gaveta y Kardex Valorizado para
            Comercios Locales.
          </p>

          <div className="login-guide-cards">
            <div className="login-guide-card">
              <UserCheck size={20} />
              <div>
                <strong>1. Identifíquese con su alias</strong>
                <p>Escriba o seleccione su usuario asignado por el administrador.</p>
              </div>
            </div>
            <div className="login-guide-card">
              <LockKeyhole size={20} />
              <div>
                <strong>2. Digite su PIN de 4 a 6 dígitos</strong>
                <p>
                  Use el teclado táctil numérico en pantalla. Tras 3 intentos
                  errados la cuenta se bloquea por seguridad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Táctil de Autenticación (US-01, US-02, RNF-06) */}
        <section className="login-form-panel">
          <form onSubmit={handleFormSubmit} className="login-form">
            <h2>Ingreso al Mostrador</h2>

            <ApiTargetSelector />

            <div className="form-group">
              <label htmlFor="login-username">Alias del Operario</label>
              <input
                id="login-username"
                type="text"
                className="touch-target form-input"
                placeholder="Ej. admin o cajero1"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                disabled={cargando}
                autoComplete="username"
                required
              />
              <div className="quick-user-chips">
                <span>Acceso rápido:</span>
                <button
                  type="button"
                  className={`touch-target chip-btn ${
                    nombreUsuario === 'admin' ? 'active' : ''
                  }`}
                  onClick={() => setNombreUsuario('admin')}
                >
                  admin (Semilla)
                </button>
                <button
                  type="button"
                  className={`touch-target chip-btn ${
                    nombreUsuario === 'cajero1' ? 'active' : ''
                  }`}
                  onClick={() => setNombreUsuario('cajero1')}
                >
                  cajero1
                </button>
              </div>
            </div>

            {errorInfo && (
              <div
                className={`alert-banner ${
                  esBloqueado ? 'alert-danger' : 'alert-warning'
                }`}
                role="alert"
              >
                {esBloqueado ? (
                  <ShieldAlert size={22} />
                ) : (
                  <AlertTriangle size={22} />
                )}
                <div>
                  <strong>
                    {errorInfo.mensaje} [{errorInfo.codigo}]
                  </strong>
                  {errorInfo.detalle && <p>{errorInfo.detalle}</p>}
                </div>
              </div>
            )}

            <TouchPinPad
              pin={pin}
              onChange={setPin}
              onSubmit={() => void ejecutarLogin()}
              disabled={cargando || !nombreUsuario.trim()}
              submitLabel={cargando ? 'Verificando PIN...' : 'Ingresar al Sistema'}
            />
          </form>
        </section>
      </div>
    </div>
  )
}
