import { Printer, Receipt, X } from 'lucide-react'
import type { FacturaDetalleResponse, VentaResponse } from '../../types/api.types'
import { formatCOP, formatDateTime } from '../../utils/formatters'

interface ThermalTicketModalProps {
  venta?: VentaResponse | null
  facturaDetalle?: FacturaDetalleResponse | null
  onClose: () => void
}

export function ThermalTicketModal({
  venta,
  facturaDetalle,
  onClose,
}: ThermalTicketModalProps) {
  if (!venta && !facturaDetalle) return null

  const numeroTicket =
    facturaDetalle?.numero_ticket ?? venta?.factura?.numero_ticket ?? 'POS-SIN-NUM'
  const fechaEmision =
    facturaDetalle?.fecha_emision ??
    venta?.factura?.fecha_emision ??
    venta?.fecha_venta ??
    ''
  const clienteNombre =
    facturaDetalle?.cliente_nombre ??
    venta?.factura?.cliente_nombre ??
    'CONSUMIDOR FINAL'
  const clienteIdentificacion =
    facturaDetalle?.cliente_identificacion ??
    venta?.factura?.cliente_identificacion ??
    '222222222222'
  const estadoFactura =
    facturaDetalle?.estado ?? venta?.factura?.estado ?? 'EMITIDA'

  const negocioNombre =
    facturaDetalle?.negocio?.nombre_establecimiento ??
    'PUNTOVENTA ÁGIL (PVA) - COMERCIO LOCAL'
  const negocioNit = facturaDetalle?.negocio?.nit_rut ?? 'NIT 900.000.000-1'
  const negocioDir =
    facturaDetalle?.negocio?.direccion ?? 'Mostrador Principal'
  const negocioTel = facturaDetalle?.negocio?.telefono_contacto ?? ''
  const pieTicket =
    facturaDetalle?.negocio?.pie_ticket ??
    '¡Gracias por su compra! Conserve su tirilla.'

  const items = facturaDetalle
    ? facturaDetalle.items
    : (venta?.items ?? []).map((i) => ({
        nombre_producto: i.nombre_producto,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        descuento_linea: i.descuento_linea,
        porcentaje_iva: i.porcentaje_iva,
        impuesto_linea: i.impuesto_linea,
        subtotal_linea: i.subtotal_linea,
      }))

  const montoTotal =
    facturaDetalle?.monto_total ?? venta?.total_a_pagar ?? 0
  const totalImpuestos =
    facturaDetalle?.total_impuestos ?? venta?.impuesto_total ?? 0
  const subtotalBase = venta?.subtotal ?? Math.max(0, montoTotal - totalImpuestos)
  const descuentoGlobal = venta?.descuento_global ?? 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Comprobante de Venta">
      <div className="modal-card modal-ticket-container">
        <div className="modal-header no-print">
          <div className="modal-title-group">
            <Receipt size={20} />
            <h3>Comprobante Térmico (58mm / 80mm)</h3>
          </div>
          <button
            type="button"
            className="touch-target btn-icon"
            onClick={onClose}
            aria-label="Cerrar comprobante"
          >
            <X size={20} />
          </button>
        </div>

        <div className="thermal-receipt" id="printable-thermal-receipt">
          <div className="receipt-header">
            <h4 className="receipt-store-name">{negocioNombre}</h4>
            <p>NIT/RUT: {negocioNit}</p>
            <p>{negocioDir}</p>
            {negocioTel && <p>Tel: {negocioTel}</p>}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-meta">
            <div className="receipt-row">
              <span>TICKET:</span>
              <strong>{numeroTicket}</strong>
            </div>
            <div className="receipt-row">
              <span>FECHA:</span>
              <span>{formatDateTime(fechaEmision)}</span>
            </div>
            <div className="receipt-row">
              <span>CLIENTE:</span>
              <span>{clienteNombre}</span>
            </div>
            <div className="receipt-row">
              <span>DOC / NIT:</span>
              <span>{clienteIdentificacion}</span>
            </div>
            <div className="receipt-row">
              <span>ESTADO:</span>
              <span className={estadoFactura === 'ANULADA' ? 'text-danger' : ''}>
                {estadoFactura}
              </span>
            </div>
          </div>

          <div className="receipt-divider" />

          <table className="receipt-items-table">
            <thead>
              <tr>
                <th>Cant x Artículo</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="receipt-item-name">{item.nombre_producto}</div>
                    <div className="receipt-item-sub">
                      {item.cantidad} x {formatCOP(item.precio_unitario)}
                      {item.descuento_linea > 0 &&
                        ` (-${formatCOP(item.descuento_linea)})`}
                      {item.porcentaje_iva > 0 && ` [IVA ${item.porcentaje_iva}%]`}
                    </div>
                  </td>
                  <td className="text-right">
                    {formatCOP(item.subtotal_linea + item.impuesto_linea)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider" />

          <div className="receipt-totals">
            <div className="receipt-row">
              <span>SUBTOTAL BASE:</span>
              <span>{formatCOP(subtotalBase)}</span>
            </div>
            {descuentoGlobal > 0 && (
              <div className="receipt-row">
                <span>DESCUENTO GLOBAL:</span>
                <span>- {formatCOP(descuentoGlobal)}</span>
              </div>
            )}
            <div className="receipt-row">
              <span>IVA DISCRIMINADO:</span>
              <span>{formatCOP(totalImpuestos)}</span>
            </div>
            <div className="receipt-row receipt-row-grand">
              <span>TOTAL PAGADO:</span>
              <strong>{formatCOP(montoTotal)}</strong>
            </div>

            {venta && (
              <>
                <div className="receipt-row">
                  <span>MEDIO DE PAGO:</span>
                  <span>{venta.medio_pago}</span>
                </div>
                <div className="receipt-row">
                  <span>RECIBIDO:</span>
                  <span>{formatCOP(venta.monto_recibido)}</span>
                </div>
                <div className="receipt-row receipt-row-change">
                  <span>CAMBIO / VUELTO:</span>
                  <strong>{formatCOP(venta.cambio_entregado)}</strong>
                </div>
              </>
            )}
          </div>

          {facturaDetalle?.motivo_anulacion && (
            <div className="receipt-void-box">
              <strong>ANULADA:</strong> {facturaDetalle.motivo_anulacion}
            </div>
          )}

          <div className="receipt-divider" />
          <p className="receipt-footer">{pieTicket}</p>
        </div>

        <div className="modal-footer no-print">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="touch-target btn btn-primary"
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span>Imprimir Tirilla (ESC/POS)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
