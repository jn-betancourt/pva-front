import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PvaApiError } from '../../api/httpClient'
import { productosService } from '../../api/services/productos.service'
import { ventasService } from '../../api/services/ventas.service'
import type { ProductoResponse, VentaResumenResponse } from '../../types/api.types'
import { formatCOP, formatDateTime } from '../../utils/formatters'

export function ReportesPage() {
  const [ventas, setVentas] = useState<VentaResumenResponse[]>([])
  const [productos, setProductos] = useState<ProductoResponse[]>([])
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const cargarDatosConsolidados = useCallback(async () => {
    setCargando(true)
    setErrorMsg(null)
    try {
      const [listaVentas, listaProductos] = await Promise.all([
        ventasService.listar(),
        productosService.listar({ activo: true }),
      ])
      setVentas(listaVentas)
      setProductos(listaProductos)
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'Error consolidando los datos de reportes comerciales',
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarDatosConsolidados()
    })
  }, [cargarDatosConsolidados])

  const metricas = useMemo(() => {
    const confirmadas = ventas.filter((v) => v.estado === 'CONFIRMADA')
    const anuladas = ventas.filter((v) => v.estado === 'ANULADA')

    const totalRecaudado = confirmadas.reduce(
      (acc, v) => acc + Number(v.total_a_pagar),
      0,
    )
    const totalEfectivo = confirmadas
      .filter((v) => v.medio_pago === 'EFECTIVO')
      .reduce((acc, v) => acc + Number(v.total_a_pagar), 0)
    const totalTransferencia = confirmadas
      .filter((v) => v.medio_pago === 'TRANSFERENCIA')
      .reduce((acc, v) => acc + Number(v.total_a_pagar), 0)
    const totalTarjeta = confirmadas
      .filter((v) => v.medio_pago === 'TARJETA')
      .reduce((acc, v) => acc + Number(v.total_a_pagar), 0)

    const valorInventarioCpp = productos.reduce(
      (acc, p) => acc + Number(p.stock_actual) * Number(p.costo_promedio),
      0,
    )

    return {
      totalRecaudado,
      totalEfectivo,
      totalTransferencia,
      totalTarjeta,
      cantidadConfirmadas: confirmadas.length,
      cantidadAnuladas: anuladas.length,
      ticketPromedio:
        confirmadas.length > 0 ? totalRecaudado / confirmadas.length : 0,
      valorInventarioCpp,
    }
  }, [ventas, productos])

  // US-19: Exportación de movimientos a formato CSV UTF-8 estándar (RNF-08)
  const exportarVentasCSV = () => {
    const headers = [
      'id_venta',
      'numero_ticket',
      'fecha_venta',
      'nombre_operario',
      'medio_pago',
      'total_a_pagar',
      'estado',
    ]
    const filas = ventas.map((v) =>
      [
        v.id_venta,
        `"${v.numero_ticket ?? ''}"`,
        `"${v.fecha_venta}"`,
        `"${v.nombre_operario}"`,
        v.medio_pago,
        v.total_a_pagar,
        v.estado,
      ].join(','),
    )
    const contenidoCsv = '\uFEFF' + [headers.join(','), ...filas].join('\n')
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_ventas_pva_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportarInventarioCSV = () => {
    const headers = [
      'id_producto',
      'codigo_barras',
      'nombre',
      'categoria',
      'stock_actual',
      'stock_minimo',
      'costo_promedio_cpp',
      'precio_venta',
      'valor_total_cpp',
    ]
    const filas = productos.map((p) =>
      [
        p.id_producto,
        `"${p.codigo_barras ?? ''}"`,
        `"${p.nombre}"`,
        `"${p.nombre_categoria}"`,
        p.stock_actual,
        p.stock_minimo,
        p.costo_promedio,
        p.precio_venta,
        (Number(p.stock_actual) * Number(p.costo_promedio)).toFixed(2),
      ].join(','),
    )
    const contenidoCsv = '\uFEFF' + [headers.join(','), ...filas].join('\n')
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventario_valorizado_pva_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} /> Balance Comercial y Exportación CSV
          </h1>
          <p className="page-subtitle">
            Consolidado de ingresos por medio de pago (US-17, US-18),
            valorización de inventario al CPP y exportación CSV UTF-8 (US-19).
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={() => void cargarDatosConsolidados()}
            disabled={cargando}
          >
            <RefreshCw size={18} />
            <span>Actualizar Balance</span>
          </button>
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={exportarInventarioCSV}
            disabled={productos.length === 0}
          >
            <Download size={18} />
            <span>CSV Inventario (US-19)</span>
          </button>
          <button
            type="button"
            className="touch-target btn btn-primary"
            onClick={exportarVentasCSV}
            disabled={ventas.length === 0}
          >
            <Download size={18} />
            <span>Exportar Ventas a CSV (US-19)</span>
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert-banner alert-danger">{errorMsg}</div>}

      <div className="kpi-grid">
        <div className="kpi-box">
          <span className="kpi-label">
            <TrendingUp size={15} /> Total Ventas Netas Confirmadas
          </span>
          <strong className="kpi-value">
            {formatCOP(metricas.totalRecaudado)}
          </strong>
          <span className="kpi-note">
            {metricas.cantidadConfirmadas} tickets emitidos ({metricas.cantidadAnuladas} anulados)
          </span>
        </div>

        <div className="kpi-box">
          <span className="kpi-label">
            <Wallet size={15} /> Ticket Promedio (AOV)
          </span>
          <strong className="kpi-value">
            {formatCOP(metricas.ticketPromedio)}
          </strong>
          <span className="kpi-note">Meta de monitoreo comercial RD-03</span>
        </div>

        <div className="kpi-box">
          <span className="kpi-label">Valorización de Bodega (CPP)</span>
          <strong className="kpi-value">
            {formatCOP(metricas.valorInventarioCpp)}
          </strong>
          <span className="kpi-note">{productos.length} SKUs activos</span>
        </div>
      </div>

      <div className="grid-2col">
        <section className="card">
          <h2>Desglose por Medio de Pago (US-17 / US-18)</h2>
          <div className="acta-rows">
            <div className="acta-row">
              <span>Recaudo en Efectivo (Gaveta):</span>
              <strong>{formatCOP(metricas.totalEfectivo)}</strong>
            </div>
            <div className="acta-row">
              <span>Recaudo por Transferencia (Nequi / Daviplata):</span>
              <strong>{formatCOP(metricas.totalTransferencia)}</strong>
            </div>
            <div className="acta-row">
              <span>Recaudo por Tarjeta (Datafono):</span>
              <strong>{formatCOP(metricas.totalTarjeta)}</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Últimas Transacciones Registradas</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Fecha</th>
                  <th>Medio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 6).map((v) => (
                  <tr key={v.id_venta}>
                    <td>
                      <strong>{v.numero_ticket ?? `#${v.id_venta}`}</strong>
                    </td>
                    <td>{formatDateTime(v.fecha_venta)}</td>
                    <td>{v.medio_pago}</td>
                    <td>{formatCOP(v.total_a_pagar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
