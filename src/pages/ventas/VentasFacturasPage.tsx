import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PvaApiError } from '../../api/httpClient'
import { facturasService } from '../../api/services/facturas.service'
import { ventasService } from '../../api/services/ventas.service'
import { ThermalTicketModal } from '../../components/pos/ThermalTicketModal'
import { useAuth } from '../../context/AuthContext'
import type {
  EstadoFactura,
  EstadoVenta,
  FacturaDetalleResponse,
  FacturaResumenResponse,
  MedioPago,
  VentaResponse,
  VentaResumenResponse,
} from '../../types/api.types'
import { formatCOP, formatDateTime } from '../../utils/formatters'

export function VentasFacturasPage() {
  const { isAdmin } = useAuth()
  const [tabActiva, setTabActiva] = useState<'ventas' | 'facturas'>('ventas')

  // Estado Pestaña Ventas (/api/v1/ventas)
  const [ventas, setVentas] = useState<VentaResumenResponse[]>([])
  const [filtroEstadoVenta, setFiltroEstadoVenta] = useState<EstadoVenta | ''>(
    '',
  )
  const [filtroMedioPago, setFiltroMedioPago] = useState<MedioPago | ''>('')
  const [cargandoVentas, setCargandoVentas] = useState(false)

  // Estado Pestaña Facturas (/api/v1/facturas)
  const [facturas, setFacturas] = useState<FacturaResumenResponse[]>([])
  const [busquedaTicket, setBusquedaTicket] = useState('')
  const [busquedaCedula, setBusquedaCedula] = useState('')
  const [filtroEstadoFactura, setFiltroEstadoFactura] = useState<
    EstadoFactura | ''
  >('')
  const [cargandoFacturas, setCargandoFacturas] = useState(false)

  // Modales de Detalle / Reimpresión (US-15) y Anulación Supervisada (US-16)
  const [ventaSeleccionada, setVentaSeleccionada] =
    useState<VentaResponse | null>(null)
  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<FacturaDetalleResponse | null>(null)
  const [ventaPorAnular, setVentaPorAnular] =
    useState<VentaResumenResponse | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const cargarVentas = useCallback(async () => {
    setCargandoVentas(true)
    setErrorMsg(null)
    try {
      const lista = await ventasService.listar({
        estado: filtroEstadoVenta || undefined,
        medio_pago: filtroMedioPago || undefined,
      })
      setVentas(lista)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'Error al consultar el historial de ventas',
      )
    } finally {
      setCargandoVentas(false)
    }
  }, [filtroEstadoVenta, filtroMedioPago])

  const cargarFacturas = useCallback(async () => {
    setCargandoFacturas(true)
    setErrorMsg(null)
    try {
      const lista = await facturasService.listar({
        numero_ticket: busquedaTicket.trim() || undefined,
        cliente_identificacion: busquedaCedula.trim() || undefined,
        estado: filtroEstadoFactura || undefined,
      })
      setFacturas(lista)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'Error al consultar los comprobantes emitidos',
      )
    } finally {
      setCargandoFacturas(false)
    }
  }, [busquedaTicket, busquedaCedula, filtroEstadoFactura])

  useEffect(() => {
    queueMicrotask(() => {
      if (tabActiva === 'ventas') {
        void cargarVentas()
      } else {
        void cargarFacturas()
      }
    })
  }, [tabActiva, cargarVentas, cargarFacturas])

  const handleVerDetalleVenta = async (idVenta: number) => {
    setErrorMsg(null)
    try {
      const detalle = await ventasService.obtenerPorId(idVenta)
      setVentaSeleccionada(detalle)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No se pudo obtener el detalle de la venta',
      )
    }
  }

  const handleReimprimirFactura = async (idFactura: number) => {
    setErrorMsg(null)
    try {
      const detalle = await facturasService.obtenerPorId(idFactura)
      setFacturaSeleccionada(detalle)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No se pudo obtener el comprobante para reimpresión',
      )
    }
  }

  const handleConfirmarAnulacion = async (e: FormEvent) => {
    e.preventDefault()
    if (!ventaPorAnular || !motivoAnulacion.trim()) return
    setProcesandoAnulacion(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await ventasService.anular(ventaPorAnular.id_venta, {
        motivo_anulacion: motivoAnulacion.trim(),
      })
      setSuccessMsg(
        `${resp.mensaje} (Ticket ${resp.factura.numero_ticket} marcado como ${resp.factura.estado})`,
      )
      setVentaPorAnular(null)
      setMotivoAnulacion('')
      void cargarVentas()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
          : 'No se pudo anular la venta',
      )
    } finally {
      setProcesandoAnulacion(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ReceiptText size={28} /> Historial de Ventas y Comprobantes
          </h1>
          <p className="page-subtitle">
            Reimpresión de tickets correlativos (US-15) y anulación supervisada
            con reversión en Kardex y caja (US-16).
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={() =>
              tabActiva === 'ventas' ? void cargarVentas() : void cargarFacturas()
            }
          >
            <RefreshCw size={18} />
            <span>Refrescar Lista</span>
          </button>
        </div>
      </div>

      {/* Selector de Sub-módulo */}
      <div className="subnav-tabs">
        <button
          type="button"
          className={`touch-target subnav-tab ${
            tabActiva === 'ventas' ? 'active' : ''
          }`}
          onClick={() => setTabActiva('ventas')}
        >
          <ReceiptText size={18} />
          <span>Transacciones de Venta (/api/v1/ventas)</span>
        </button>
        <button
          type="button"
          className={`touch-target subnav-tab ${
            tabActiva === 'facturas' ? 'active' : ''
          }`}
          onClick={() => setTabActiva('facturas')}
        >
          <FileText size={18} />
          <span>Comprobantes / Tirillas (/api/v1/facturas)</span>
        </button>
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

      {tabActiva === 'ventas' ? (
        <section className="card">
          <div className="filters-toolbar">
            <div className="form-group-inline">
              <label htmlFor="filtro-estado-venta">Estado:</label>
              <select
                id="filtro-estado-venta"
                className="touch-target form-input"
                value={filtroEstadoVenta}
                onChange={(e) =>
                  setFiltroEstadoVenta(e.target.value as EstadoVenta | '')
                }
              >
                <option value="">Todos los estados</option>
                <option value="CONFIRMADA">CONFIRMADA</option>
                <option value="ANULADA">ANULADA</option>
              </select>
            </div>

            <div className="form-group-inline">
              <label htmlFor="filtro-medio-venta">Medio de Pago:</label>
              <select
                id="filtro-medio-venta"
                className="touch-target form-input"
                value={filtroMedioPago}
                onChange={(e) =>
                  setFiltroMedioPago(e.target.value as MedioPago | '')
                }
              >
                <option value="">Todos los medios</option>
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="TARJETA">TARJETA</option>
              </select>
            </div>
          </div>

          {cargandoVentas ? (
            <div className="empty-state">Consultando ventas...</div>
          ) : ventas.length === 0 ? (
            <div className="empty-state">
              No se encontraron ventas con los filtros seleccionados.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ticket</th>
                    <th>Fecha y Hora</th>
                    <th>Cajero / Operario</th>
                    <th>Medio Pago</th>
                    <th>Total Pagado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.id_venta}>
                      <td>#{v.id_venta}</td>
                      <td>
                        <strong>{v.numero_ticket ?? '—'}</strong>
                      </td>
                      <td>{formatDateTime(v.fecha_venta)}</td>
                      <td>{v.nombre_operario}</td>
                      <td>
                        <span className="badge-neutral">{v.medio_pago}</span>
                      </td>
                      <td>
                        <strong>{formatCOP(v.total_a_pagar)}</strong>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            v.estado === 'CONFIRMADA'
                              ? 'status-online'
                              : 'status-offline'
                          }`}
                        >
                          {v.estado}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="touch-target btn btn-secondary btn-sm"
                            onClick={() => void handleVerDetalleVenta(v.id_venta)}
                          >
                            <Eye size={16} />
                            <span>Ver Ticket</span>
                          </button>

                          {isAdmin && v.estado === 'CONFIRMADA' && (
                            <button
                              type="button"
                              className="touch-target btn btn-outline-danger btn-sm"
                              onClick={() => {
                                setVentaPorAnular(v)
                                setMotivoAnulacion('')
                              }}
                            >
                              <Ban size={16} />
                              <span>Anular (US-16)</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <div className="filters-toolbar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="touch-target form-input"
                placeholder="Consecutivo Ticket (Ej. POS-000001)"
                value={busquedaTicket}
                onChange={(e) => setBusquedaTicket(e.target.value)}
              />
            </div>

            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="touch-target form-input"
                placeholder="Cédula / NIT Cliente (Ej. 222222222222)"
                value={busquedaCedula}
                onChange={(e) => setBusquedaCedula(e.target.value)}
              />
            </div>

            <select
              className="touch-target form-input"
              value={filtroEstadoFactura}
              onChange={(e) =>
                setFiltroEstadoFactura(e.target.value as EstadoFactura | '')
              }
            >
              <option value="">Estado: Todas</option>
              <option value="EMITIDA">EMITIDA</option>
              <option value="ANULADA">ANULADA</option>
            </select>
          </div>

          {cargandoFacturas ? (
            <div className="empty-state">Consultando comprobantes...</div>
          ) : facturas.length === 0 ? (
            <div className="empty-state">
              No se encontraron comprobantes emitidos.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Factura</th>
                    <th>N° Ticket</th>
                    <th>Cliente</th>
                    <th>Identificación</th>
                    <th>Fecha Emisión</th>
                    <th>Monto Total</th>
                    <th>Estado</th>
                    <th>Reimpresión</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id_factura}>
                      <td>#{f.id_factura}</td>
                      <td>
                        <strong>{f.numero_ticket}</strong>
                      </td>
                      <td>{f.cliente_nombre}</td>
                      <td>{f.cliente_identificacion}</td>
                      <td>{formatDateTime(f.fecha_emision)}</td>
                      <td>
                        <strong>{formatCOP(f.monto_total)}</strong>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            f.estado === 'EMITIDA'
                              ? 'status-online'
                              : 'status-offline'
                          }`}
                        >
                          {f.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="touch-target btn btn-primary btn-sm"
                          onClick={() =>
                            void handleReimprimirFactura(f.id_factura)
                          }
                        >
                          <Printer size={16} />
                          <span>Tirilla Térmica</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modal de Anulación Supervisada (US-16 / RN-VTA-05) */}
      {ventaPorAnular && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <Ban size={22} className="text-danger" />
                <h3>
                  Anular Venta #{ventaPorAnular.id_venta} (
                  {ventaPorAnular.numero_ticket})
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmarAnulacion} className="form-stack">
              <div className="alert-banner alert-warning">
                <AlertCircle size={20} />
                <div>
                  <strong>Reversión Transaccional Compensatoria (RN-VTA-05)</strong>
                  <p>
                    Al confirmar, el servidor reintegrará las unidades vendidas
                    al stock con movimiento <code>AJUSTE_ENTRADA</code> en el
                    Kardex y descontará {formatCOP(ventaPorAnular.total_a_pagar)}{' '}
                    del turno activo.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="motivo-anulacion-input">
                  Motivo de Anulación (Obligatorio para Bitácora de Auditoría) *
                </label>
                <textarea
                  id="motivo-anulacion-input"
                  rows={3}
                  className="form-input"
                  placeholder="Ej. Error de digitación en cantidad o devolución inmediata en mostrador"
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setVentaPorAnular(null)}
                  disabled={procesandoAnulacion}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="touch-target btn btn-danger"
                  disabled={procesandoAnulacion || !motivoAnulacion.trim()}
                >
                  <Ban size={18} />
                  <span>
                    {procesandoAnulacion
                      ? 'Revertiendo Stock y Caja...'
                      : 'Confirmar Anulación Definitiva'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comprobante Térmico para Venta o Factura */}
      {(ventaSeleccionada || facturaSeleccionada) && (
        <ThermalTicketModal
          venta={ventaSeleccionada}
          facturaDetalle={facturaSeleccionada}
          onClose={() => {
            setVentaSeleccionada(null)
            setFacturaSeleccionada(null)
          }}
        />
      )}
    </div>
  )
}
