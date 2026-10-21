import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  FileCheck2,
  Lock,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Unlock,
  Vault,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PvaApiError } from '../../api/httpClient'
import { turnosService } from '../../api/services/turnos.service'
import { BillQuickSelector } from '../../components/pos/BillQuickSelector'
import { useAuth } from '../../context/AuthContext'
import { useTurno } from '../../context/TurnoContext'
import type { TurnoResponse } from '../../types/api.types'
import { formatCOP, formatDateTime } from '../../utils/formatters'

export function TurnoPage() {
  const { isAdmin } = useAuth()
  const {
    turnoActivo,
    tieneTurnoAbierto,
    cargandoTurno,
    abrirTurno,
    cerrarTurno,
    refrescarTurnoActivo,
  } = useTurno()
  const navigate = useNavigate()

  // Estado para Apertura de Turno (US-04)
  const [baseInicial, setBaseInicial] = useState<number>(100000)
  const [procesandoApertura, setProcesandoApertura] = useState(false)

  // Estado para Arqueo Ciego y Cierre de Turno (US-05)
  const [mostrarModalArqueo, setMostrarModalArqueo] = useState(false)
  const [montoFisicoArqueo, setMontoFisicoArqueo] = useState<number>(0)
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [procesandoCierre, setProcesandoCierre] = useState(false)

  // Acta resultante tras cerrar o consultar turno por ID (US-05 / US-17)
  const [actaTurnoCerrado, setActaTurnoCerrado] =
    useState<TurnoResponse | null>(null)
  const [idTurnoConsulta, setIdTurnoConsulta] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAbrirTurno = async (e: FormEvent) => {
    e.preventDefault()
    if (baseInicial < 0) {
      setErrorMsg('La base inicial en efectivo debe ser mayor o igual a cero.')
      return
    }
    setProcesandoApertura(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const nuevo = await abrirTurno({ base_efectivo_inicial: baseInicial })
      setSuccessMsg(
        `Turno #${nuevo.id_turno} abierto correctamente con base inicial de ${formatCOP(
          nuevo.base_efectivo_inicial,
        )}. El módulo de ventas POS está habilitado.`,
      )
      setActaTurnoCerrado(null)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message} (${err.codigo})`
          : 'Error al abrir el turno de caja',
      )
    } finally {
      setProcesandoApertura(false)
    }
  }

  const handleConfirmarArqueoCiego = async (e: FormEvent) => {
    e.preventDefault()
    if (!turnoActivo?.id_turno) return
    if (montoFisicoArqueo < 0) {
      setErrorMsg('El monto físico contado no puede ser negativo.')
      return
    }
    setProcesandoCierre(true)
    setErrorMsg(null)
    try {
      const acta = await cerrarTurno(turnoActivo.id_turno, {
        monto_fisico_arqueo: montoFisicoArqueo,
        observaciones_cierre: observacionesCierre.trim() || null,
      })
      setActaTurnoCerrado(acta)
      setMostrarModalArqueo(false)
      setSuccessMsg(
        `Turno #${acta.id_turno} cerrado exitosamente. Revise el Acta de Arqueo a continuación.`,
      )
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
          : 'Error al cerrar el turno de caja',
      )
    } finally {
      setProcesandoCierre(false)
    }
  }

  const handleConsultarTurnoPorId = async (e: FormEvent) => {
    e.preventDefault()
    const idNum = Number(idTurnoConsulta)
    if (!idNum || idNum <= 0) return
    setErrorMsg(null)
    try {
      const resp = await turnosService.obtenerPorId(idNum)
      setActaTurnoCerrado(resp)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message} (${err.codigo})`
          : 'No se encontró el turno solicitado',
      )
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Vault size={28} /> Gaveta de Efectivo y Turno de Caja
          </h1>
          <p className="page-subtitle">
            Apertura con base inicial y cierre transparente mediante
            Arqueo Ciego.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={() => void refrescarTurnoActivo()}
            disabled={cargandoTurno}
          >
            <RefreshCw size={18} />
            <span>Actualizar Estado</span>
          </button>
          {tieneTurnoAbierto && (
            <button
              type="button"
              className="touch-target btn btn-primary"
              onClick={() => navigate('/pos')}
            >
              <ShoppingCart size={18} />
              <span>Ir a Vender al POS</span>
            </button>
          )}
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

      <div className="grid-2col">
        {/* Tarjeta Principal: Apertura (US-04) o Estado de Turno Abierto (US-05) */}
        {!tieneTurnoAbierto ? (
          <section className="card">
            <div className="card-header">
              <Lock size={22} className="text-warning" />
              <div>
                <h2>Abrir Turno de Caja</h2>
                <p>
                  Debe declarar la base de sencillo/efectivo inicial en la gaveta
                  para desbloquear el mostrador de ventas.
                </p>
              </div>
            </div>

            <form onSubmit={handleAbrirTurno} className="form-stack">
              <div className="form-group">
                <label htmlFor="base-inicial-input">
                  Base de Efectivo Inicial en Gaveta ($ COP)
                </label>
                <input
                  id="base-inicial-input"
                  type="number"
                  min={0}
                  step="500"
                  className="touch-target form-input form-input-lg"
                  value={baseInicial}
                  onChange={(e) => setBaseInicial(Number(e.target.value))}
                  required
                />
              </div>

              <BillQuickSelector
                totalAPagar={50000}
                montoActual={baseInicial}
                onSelectAmount={(val) => setBaseInicial(val)}
              />

              <button
                type="submit"
                className="touch-target btn btn-primary btn-lg btn-block"
                disabled={procesandoApertura}
              >
                <Unlock size={20} />
                <span>
                  {procesandoApertura
                    ? 'Abriendo Gaveta...'
                    : `Confirmar Apertura con ${formatCOP(baseInicial)}`}
                </span>
              </button>
            </form>
          </section>
        ) : (
          <section className="card card-highlight-open">
            <div className="card-header">
              <Unlock size={24} className="text-success" />
              <div>
                <h2>Turno Activo #{turnoActivo?.id_turno} en Curso</h2>
                <p>
                  Operario responsable:{' '}
                  <strong>{turnoActivo?.nombre_operario}</strong> • Abierto:{' '}
                  {formatDateTime(turnoActivo?.fecha_apertura)}
                </p>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-box">
                <span className="kpi-label">Base Inicial en Gaveta</span>
                <strong className="kpi-value">
                  {formatCOP(turnoActivo?.base_efectivo_inicial)}
                </strong>
              </div>
              <div className="kpi-box">
                <span className="kpi-label">Cobros Digitales (Nequi / Tarjeta)</span>
                <strong className="kpi-value">
                  {formatCOP(turnoActivo?.total_digital_ventas)}
                </strong>
              </div>
              <div className="kpi-box kpi-box-blind">
                <span className="kpi-label">
                  <EyeOff size={14} /> Efectivo Esperado en Gaveta
                </span>
                <strong className="kpi-value">Protegido (Arqueo Ciego)</strong>
                <span className="kpi-note">
                  Se muestra después de declarar el conteo físico al cerrar
                </span>
              </div>
            </div>

            <div className="card-actions-footer">
              <button
                type="button"
                className="touch-target btn btn-danger btn-lg"
                onClick={() => {
                  setMontoFisicoArqueo(0)
                  setObservacionesCierre('')
                  setMostrarModalArqueo(true)
                }}
              >
                <Lock size={18} />
                <span>Realizar Arqueo Ciego y Cerrar Turno</span>
              </button>
            </div>
          </section>
        )}

        {/* Panel Derecho: Acta de Arqueo y Consulta de Turno por ID (US-05 / US-17) */}
        <section className="card">
          <div className="card-header">
            <FileCheck2 size={22} />
            <div>
              <h2>Acta de Corte y Arqueo de Turno</h2>
              <p>
                Consulte el resultado de un turno cerrado o verifique discrepancias
                auditables.
              </p>
            </div>
          </div>

          <form onSubmit={handleConsultarTurnoPorId} className="inline-search-form no-print">
            <input
              type="number"
              min={1}
              className="touch-target form-input"
              placeholder={
                isAdmin
                  ? 'Buscar cualquier ID de turno (Ej. 1)'
                  : 'Buscar ID de mi turno (Ej. 1)'
              }
              value={idTurnoConsulta}
              onChange={(e) => setIdTurnoConsulta(e.target.value)}
            />
            <button type="submit" className="touch-target btn btn-secondary">
              <Search size={18} />
              <span>Consultar Turno</span>
            </button>
          </form>

          {actaTurnoCerrado ? (
            <div className="acta-arqueo-box">
              <div className="acta-header">
                <div>
                  <h3>Acta de Turno #{actaTurnoCerrado.id_turno}</h3>
                  <p>Operario: {actaTurnoCerrado.nombre_operario}</p>
                </div>
                <span
                  className={`status-pill ${
                    actaTurnoCerrado.estado === 'CERRADO'
                      ? 'status-offline'
                      : 'status-online'
                  }`}
                >
                  {actaTurnoCerrado.estado}
                </span>
              </div>

              <div className="acta-rows">
                <div className="acta-row">
                  <span>Apertura:</span>
                  <strong>{formatDateTime(actaTurnoCerrado.fecha_apertura)}</strong>
                </div>
                <div className="acta-row">
                  <span>Cierre:</span>
                  <strong>{formatDateTime(actaTurnoCerrado.fecha_cierre)}</strong>
                </div>
                <div className="acta-row">
                  <span>Base Efectivo Inicial:</span>
                  <strong>{formatCOP(actaTurnoCerrado.base_efectivo_inicial)}</strong>
                </div>
                <div className="acta-row">
                  <span>Ventas en Efectivo:</span>
                  <strong>{formatCOP(actaTurnoCerrado.total_efectivo_ventas)}</strong>
                </div>
                <div className="acta-row">
                  <span>Ventas Digitales (Transferencia/Tarjeta):</span>
                  <strong>{formatCOP(actaTurnoCerrado.total_digital_ventas)}</strong>
                </div>
                <div className="acta-row">
                  <span>Efectivo Esperado en Gaveta:</span>
                  <strong>
                    {formatCOP(
                      Number(actaTurnoCerrado.base_efectivo_inicial) +
                        Number(actaTurnoCerrado.total_efectivo_ventas),
                    )}
                  </strong>
                </div>
                {actaTurnoCerrado.monto_fisico_arqueo !== null && (
                  <>
                    <div className="acta-row">
                      <span>Efectivo Físico Contado (Arqueo):</span>
                      <strong>
                        {formatCOP(actaTurnoCerrado.monto_fisico_arqueo)}
                      </strong>
                    </div>
                    <div
                      className={`acta-row acta-discrepancia ${
                        Number(actaTurnoCerrado.discrepancia) === 0
                          ? 'discrepancia-ok'
                          : Number(actaTurnoCerrado.discrepancia) > 0
                            ? 'discrepancia-sobrante'
                            : 'discrepancia-faltante'
                      }`}
                    >
                      <span>Discrepancia de Caja:</span>
                      <strong>
                        {formatCOP(actaTurnoCerrado.discrepancia)}{' '}
                        {Number(actaTurnoCerrado.discrepancia) === 0
                          ? '(Cuadre Exacto)'
                          : Number(actaTurnoCerrado.discrepancia) > 0
                            ? '(Sobrante)'
                            : '(Faltante)'}
                      </strong>
                    </div>
                  </>
                )}
                {actaTurnoCerrado.observaciones_cierre && (
                  <div className="acta-observaciones">
                    <strong>Observaciones / Justificación:</strong>
                    <p>{actaTurnoCerrado.observaciones_cierre}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="touch-target btn btn-secondary btn-block no-print"
                onClick={() => window.print()}
              >
                <Printer size={18} />
                <span>Imprimir Acta de Corte</span>
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <Vault size={36} />
              <p>
                Cuando cierre un turno o consulte su ID, aquí se desplegará el
                acta oficial con el cálculo de discrepancias.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal de Arqueo Ciego (US-05 / RN-OPE-05) */}
      {mostrarModalArqueo && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <EyeOff size={22} />
                <h3>Arqueo Ciego de Gaveta — Turno #{turnoActivo?.id_turno}</h3>
              </div>
            </div>

            <form onSubmit={handleConfirmarArqueoCiego} className="form-stack">
              <div className="alert-banner alert-warning">
                <EyeOff size={20} />
                <div>
                  <strong>Arqueo ciego: el sistema no mostró el efectivo esperado antes del conteo</strong>
                  <p>
                    Cuente todos los billetes y monedas en la gaveta e ingrese el
                    valor total físico. El sistema calculará automáticamente si
                    existe faltante o sobrante.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="monto-fisico-input">
                  Total Dinero Físico Contado en Gaveta ($ COP)
                </label>
                <input
                  id="monto-fisico-input"
                  type="number"
                  min={0}
                  step="100"
                  className="touch-target form-input form-input-lg"
                  value={montoFisicoArqueo}
                  onChange={(e) => setMontoFisicoArqueo(Number(e.target.value))}
                  required
                  autoFocus
                />
              </div>

              <BillQuickSelector
                totalAPagar={100000}
                montoActual={montoFisicoArqueo}
                onSelectAmount={(val) => setMontoFisicoArqueo(val)}
              />

              <div className="form-group">
                <label htmlFor="obs-cierre-input">
                  Observaciones o Justificación de Novedades en el Turno
                </label>
                <textarea
                  id="obs-cierre-input"
                  rows={3}
                  className="form-input"
                  placeholder="Opcional si el cuadre es exacto; obligatorio si existe descuadre o retiro autorizado."
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setMostrarModalArqueo(false)}
                  disabled={procesandoCierre}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="touch-target btn btn-danger"
                  disabled={procesandoCierre}
                >
                  <Lock size={18} />
                  <span>
                    {procesandoCierre
                      ? 'Cerrando y Calculando...'
                      : `Confirmar Cierre (${formatCOP(montoFisicoArqueo)})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
