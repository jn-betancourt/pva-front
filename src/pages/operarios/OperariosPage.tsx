import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PvaApiError } from '../../api/httpClient'
import { operariosService } from '../../api/services/operarios.service'
import { TouchPinPad } from '../../components/ui/TouchPinPad'
import type { OperarioResponse, RolOperario } from '../../types/api.types'
import { formatDateTime } from '../../utils/formatters'

export function OperariosPage() {
  const [operarios, setOperarios] = useState<OperarioResponse[]>([])
  const [filtroActivo, setFiltroActivo] = useState<string>('todos')
  const [cargando, setCargando] = useState(false)

  // Modal Crear / Editar Operario (US-03)
  const [mostrarModalForm, setMostrarModalForm] = useState(false)
  const [operarioEditando, setOperarioEditando] =
    useState<OperarioResponse | null>(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    numero_documento: '',
    telefono: '',
    nombre_usuario: '',
    pin: '',
    rol: 'CAJERO' as RolOperario,
  })

  // Modal Cambio de PIN (PATCH /api/v1/operarios/{id}/pin)
  const [operarioPinTarget, setOperarioPinTarget] =
    useState<OperarioResponse | null>(null)
  const [nuevoPin, setNuevoPin] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const cargarOperarios = useCallback(async () => {
    setCargando(true)
    setErrorMsg(null)
    try {
      const paramActivo =
        filtroActivo === 'todos' ? undefined : filtroActivo === 'activos'
      const data = await operariosService.listar(paramActivo)
      setOperarios(data)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'Error al consultar la lista de operarios',
      )
    } finally {
      setCargando(false)
    }
  }, [filtroActivo])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarOperarios()
    })
  }, [cargarOperarios])

  const abrirModalCrear = () => {
    setOperarioEditando(null)
    setFormData({
      nombre_completo: '',
      numero_documento: '',
      telefono: '',
      nombre_usuario: '',
      pin: '',
      rol: 'CAJERO',
    })
    setMostrarModalForm(true)
  }

  const abrirModalEditar = (op: OperarioResponse) => {
    setOperarioEditando(op)
    setFormData({
      nombre_completo: op.nombre_completo,
      numero_documento: op.numero_documento,
      telefono: op.telefono ?? '',
      nombre_usuario: op.nombre_usuario,
      pin: '',
      rol: op.rol,
    })
    setMostrarModalForm(true)
  }

  const handleGuardarOperario = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      if (operarioEditando) {
        await operariosService.actualizar(operarioEditando.id_operario, {
          nombre_completo: formData.nombre_completo.trim(),
          telefono: formData.telefono.trim() || null,
          nombre_usuario: formData.nombre_usuario.trim(),
          rol: formData.rol,
        })
        setSuccessMsg(
          `Perfil de "${formData.nombre_completo}" actualizado correctamente.`,
        )
      } else {
        await operariosService.crear({
          nombre_completo: formData.nombre_completo.trim(),
          numero_documento: formData.numero_documento.trim(),
          telefono: formData.telefono.trim() || null,
          nombre_usuario: formData.nombre_usuario.trim(),
          pin: formData.pin,
          rol: formData.rol,
        })
        setSuccessMsg(
          `Operario "${formData.nombre_completo}" (@${formData.nombre_usuario}) registrado con PIN encriptado en BCrypt.`,
        )
      }
      setMostrarModalForm(false)
      void cargarOperarios()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
          : 'Error al guardar el operario',
      )
    }
  }

  const handleDesbloquear = async (op: OperarioResponse) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await operariosService.desbloquear(op.id_operario)
      setSuccessMsg(
        `${resp.mensaje} (${op.nombre_completo} — intentos fallidos reiniciados a ${resp.intentos_fallidos}).`,
      )
      void cargarOperarios()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No fue posible desbloquear al operario',
      )
    }
  }

  const handleInactivar = async (op: OperarioResponse) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await operariosService.inactivar(op.id_operario)
      setSuccessMsg(`${resp.mensaje}: ${op.nombre_completo}`)
      void cargarOperarios()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''} [${err.codigo}]`
          : 'Error al inactivar el operario',
      )
    }
  }

  const handleConfirmarNuevoPin = async () => {
    if (!operarioPinTarget || nuevoPin.length < 4) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await operariosService.actualizarPin(
        operarioPinTarget.id_operario,
        {
          pin_nuevo: nuevoPin,
        },
      )
      setSuccessMsg(`${resp.mensaje} para ${operarioPinTarget.nombre_completo}.`)
      setOperarioPinTarget(null)
      setNuevoPin('')
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No se pudo actualizar el PIN',
      )
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} /> Gestión de Operarios y Seguridad de Acceso
          </h1>
          <p className="page-subtitle">
            Administración de cajeros, desbloqueo por intentos fallidos
            y baja lógica protegida.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={() => void cargarOperarios()}
            disabled={cargando}
          >
            <RefreshCw size={18} />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            className="touch-target btn btn-primary"
            onClick={abrirModalCrear}
          >
            <UserPlus size={18} />
            <span>Registrar Operario</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-danger" role="alert">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-success" role="status">
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <section className="card">
        <div className="filters-toolbar">
          <div className="form-group-inline">
            <label htmlFor="filtro-estado-op">Mostrar:</label>
            <select
              id="filtro-estado-op"
              className="touch-target form-input"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
            >
              <option value="todos">Todos los operarios</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Alias Usuario</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Estado Seguridad</th>
                <th>Creado</th>
                <th>Acciones Administrativas</th>
              </tr>
            </thead>
            <tbody>
              {operarios.map((op) => {
                const bloqueado = op.intentos_fallidos >= 3
                return (
                  <tr key={op.id_operario}>
                    <td>#{op.id_operario}</td>
                    <td>
                      <strong>{op.nombre_completo}</strong>
                      {op.telefono && (
                        <div className="text-muted-sm">Tel: {op.telefono}</div>
                      )}
                    </td>
                    <td>
                      <code>@{op.nombre_usuario}</code>
                    </td>
                    <td>{op.numero_documento}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          op.rol === 'ADMIN' ? 'role-admin' : 'role-cashier'
                        }`}
                      >
                        {op.rol}
                      </span>
                    </td>
                    <td>
                      {!op.activo ? (
                        <span className="status-pill status-offline">
                          INACTIVO
                        </span>
                      ) : bloqueado ? (
                        <span className="status-pill status-offline">
                          <ShieldAlert size={14} /> BLOQUEADO (3/3 intentos)
                        </span>
                      ) : (
                        <span className="status-pill status-online">
                          ACTIVO ({op.intentos_fallidos}/3 fallos)
                        </span>
                      )}
                    </td>
                    <td>{formatDateTime(op.creado_en)}</td>
                    <td>
                      <div className="row-actions">
                        {(bloqueado || op.intentos_fallidos > 0) && (
                          <button
                            type="button"
                            className="touch-target btn btn-warning btn-sm"
                            onClick={() => void handleDesbloquear(op)}
                            title="Desbloquear operario y reiniciar intentos"
                          >
                            <Unlock size={15} />
                            <span>Desbloquear</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="touch-target btn btn-secondary btn-sm"
                          onClick={() => {
                            setOperarioPinTarget(op)
                            setNuevoPin('')
                          }}
                        >
                          <KeyRound size={15} />
                          <span>Cambiar PIN</span>
                        </button>

                        <button
                          type="button"
                          className="touch-target btn-icon"
                          onClick={() => abrirModalEditar(op)}
                          title="Editar datos del operario"
                        >
                          <Edit3 size={16} />
                        </button>

                        {op.activo && (
                          <button
                            type="button"
                            className="touch-target btn-icon text-danger"
                            onClick={() => void handleInactivar(op)}
                            title="Inactivar lógicamente (No permite si tiene turno abierto)"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Alta / Edición de Operario (US-03) */}
      {mostrarModalForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>
                {operarioEditando
                  ? `Editar Operario: ${operarioEditando.nombre_completo}`
                  : 'Registrar Nuevo Operario'}
              </h3>
            </div>

            <form onSubmit={handleGuardarOperario} className="form-stack">
              <div className="grid-2col">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    value={formData.nombre_completo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre_completo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Número de Documento *</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    value={formData.numero_documento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_documento: e.target.value,
                      })
                    }
                    disabled={Boolean(operarioEditando)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Alias de Usuario (Para Login) *</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    value={formData.nombre_usuario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre_usuario: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rol en el Sistema *</label>
                  <select
                    className="touch-target form-input"
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rol: e.target.value as RolOperario,
                      })
                    }
                  >
                    <option value="CAJERO">CAJERO (Ventas y Turno Propio)</option>
                    <option value="ADMIN">
                      ADMIN (Control Total de Tienda)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                  />
                </div>
                {!operarioEditando && (
                  <div className="form-group">
                    <label>PIN Numérico Inicial (4 a 6 dígitos) *</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4,6}"
                      maxLength={6}
                      className="touch-target form-input"
                      placeholder="Ej. 1234"
                      value={formData.pin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pin: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      required
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setMostrarModalForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="touch-target btn btn-primary">
                  Guardar Operario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambio Táctil de PIN */}
      {operarioPinTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                Asignar Nuevo PIN a {operarioPinTarget.nombre_completo} (@
                {operarioPinTarget.nombre_usuario})
              </h3>
            </div>
            <TouchPinPad
              pin={nuevoPin}
              onChange={setNuevoPin}
              onSubmit={() => void handleConfirmarNuevoPin()}
              submitLabel="Guardar Nuevo PIN (BCrypt)"
            />
            <div className="modal-footer">
              <button
                type="button"
                className="touch-target btn btn-secondary btn-block"
                onClick={() => setOperarioPinTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
