import {
  AlertTriangle,
  Barcode,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PvaApiError } from '../../api/httpClient'
import { categoriasService } from '../../api/services/categorias.service'
import { productosService } from '../../api/services/productos.service'
import { ventasService } from '../../api/services/ventas.service'
import { BillQuickSelector } from '../../components/pos/BillQuickSelector'
import { ThermalTicketModal } from '../../components/pos/ThermalTicketModal'
import { useCart } from '../../context/CartContext'
import { useTurno } from '../../context/TurnoContext'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import type {
  CategoriaResponse,
  MedioPago,
  ProductoResponse,
  VentaResponse,
} from '../../types/api.types'
import { formatCOP } from '../../utils/formatters'

export function PosPage() {
  const { turnoActivo, tieneTurnoAbierto, refrescarTurnoActivo } = useTurno()
  const {
    items,
    descuentoGlobal,
    subtotal,
    impuestoTotal,
    totalAPagar,
    totalUnidades,
    setDescuentoGlobal,
    agregarProducto,
    cambiarCantidad,
    eliminarItem,
    vaciarCarrito,
  } = useCart()
  const navigate = useNavigate()

  // Estado del Catálogo (US-07, US-12)
  const [productos, setProductos] = useState<ProductoResponse[]>([])
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | undefined>(
    undefined,
  )
  const [busqueda, setBusqueda] = useState('')
  const [codigoManual, setCodigoManual] = useState('')
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false)
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tipo: 'error' | 'success' | 'warning'
    texto: string
  } | null>(null)

  // Estado del Modal de Liquidación Multimedio (US-13, US-14, US-15)
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [medioPago, setMedioPago] = useState<MedioPago>('EFECTIVO')
  const [montoRecibido, setMontoRecibido] = useState<number>(0)
  const [referenciaPago, setReferenciaPago] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteIdentificacion, setClienteIdentificacion] = useState('')
  const [procesandoVenta, setProcesandoVenta] = useState(false)

  // Ticket emitido tras confirmar venta (US-15)
  const [ventaReciente, setVentaReciente] = useState<VentaResponse | null>(null)

  const cargarDatosCatalogo = useCallback(async () => {
    setCargandoCatalogo(true)
    try {
      const [prods, cats] = await Promise.all([
        productosService.listar({
          id_categoria: categoriaActiva,
          activo: true,
          q: busqueda.trim() || undefined,
        }),
        categoriasService.listar(true),
      ])
      setProductos(prods)
      setCategorias(cats)
    } catch (err) {
      setFeedbackBanner({
        tipo: 'error',
        texto:
          err instanceof PvaApiError
            ? err.message
            : 'No se pudo cargar el catálogo de productos.',
      })
    } finally {
      setCargandoCatalogo(false)
    }
  }, [categoriaActiva, busqueda])

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarDatosCatalogo()
    }, 180)
    return () => clearTimeout(timer)
  }, [cargarDatosCatalogo])

  // Búsqueda por Código de Barras exacto (US-07)
  const procesarLecturaBarcode = useCallback(
    async (codigo: string) => {
      if (!tieneTurnoAbierto) {
        setFeedbackBanner({
          tipo: 'warning',
          texto: 'Abra un turno de caja antes de escanear artículos.',
        })
        return
      }
      try {
        const prod = await productosService.buscarPorBarcode(codigo)
        const res = agregarProducto(prod)
        if (!res.ok) {
          setFeedbackBanner({
            tipo: 'warning',
            texto: res.mensaje || 'Sin stock disponible',
          })
        } else {
          setFeedbackBanner({
            tipo: 'success',
            texto: `Escaneado: ${prod.nombre} (${formatCOP(prod.precio_venta)})`,
          })
        }
      } catch (err) {
        setFeedbackBanner({
          tipo: 'error',
          texto:
            err instanceof PvaApiError
              ? `${err.message}: "${codigo}"`
              : `Código de barras "${codigo}" no encontrado`,
        })
      }
    },
    [tieneTurnoAbierto, agregarProducto],
  )

  useBarcodeScanner(procesarLecturaBarcode, tieneTurnoAbierto && !mostrarCheckout)

  // Botón flotante "Ver cuenta": en pantallas pequeñas el carrito queda bajo el catálogo
  const [cartPane, setCartPane] = useState<HTMLElement | null>(null)
  const [cartVisible, setCartVisible] = useState(true)
  useEffect(() => {
    if (!cartPane) return
    const observer = new IntersectionObserver(
      ([entry]) => setCartVisible(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(cartPane)
    return () => observer.disconnect()
  }, [cartPane])

  const irAlCarrito = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cartPane?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!codigoManual.trim()) return
    void procesarLecturaBarcode(codigoManual.trim())
    setCodigoManual('')
  }

  const handleSeleccionarProducto = (prod: ProductoResponse) => {
    const res = agregarProducto(prod)
    if (!res.ok && res.mensaje) {
      setFeedbackBanner({ tipo: 'warning', texto: res.mensaje })
    } else {
      setFeedbackBanner(null)
    }
  }

  const abrirModalCobro = () => {
    if (items.length === 0) return
    setMedioPago('EFECTIVO')
    setMontoRecibido(totalAPagar)
    setReferenciaPago('')
    setMostrarCheckout(true)
  }

  const cambioCalculado =
    medioPago === 'EFECTIVO'
      ? Math.max(0, Math.round((montoRecibido - totalAPagar) * 100) / 100)
      : 0

  const efectivoInsuficiente =
    medioPago === 'EFECTIVO' && montoRecibido < totalAPagar

  const faltaReferenciaDigital =
    (medioPago === 'TRANSFERENCIA' || medioPago === 'TARJETA') &&
    !referenciaPago.trim()

  const handleConfirmarVenta = async (e: FormEvent) => {
    e.preventDefault()
    if (!turnoActivo?.id_turno || efectivoInsuficiente || faltaReferenciaDigital) {
      return
    }
    setProcesandoVenta(true)
    setFeedbackBanner(null)
    try {
      const respuesta = await ventasService.crear({
        id_turno: turnoActivo.id_turno,
        items: items.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          descuento_linea: i.descuento_linea,
        })),
        descuento_global: descuentoGlobal,
        medio_pago: medioPago,
        monto_recibido: medioPago === 'EFECTIVO' ? montoRecibido : totalAPagar,
        referencia_pago:
          medioPago === 'EFECTIVO' ? null : referenciaPago.trim() || null,
        cliente:
          clienteNombre.trim() || clienteIdentificacion.trim()
            ? {
                nombre: clienteNombre.trim() || 'CONSUMIDOR FINAL',
                identificacion: clienteIdentificacion.trim() || '222222222222',
              }
            : null,
      })

      vaciarCarrito()
      setMostrarCheckout(false)
      setClienteNombre('')
      setClienteIdentificacion('')
      setVentaReciente(respuesta)
      void cargarDatosCatalogo()
      void refrescarTurnoActivo()
    } catch (err) {
      setFeedbackBanner({
        tipo: 'error',
        texto:
          err instanceof PvaApiError
            ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
            : 'No fue posible procesar la venta.',
      })
    } finally {
      setProcesandoVenta(false)
    }
  }

  // Regla de Negocio RN-VTA-01 / RN-OPE-04: Bloqueo de pantalla si no hay turno abierto
  if (!tieneTurnoAbierto) {
    return (
      <div className="page-container">
        <div className="pos-locked-banner card">
          <div className="locked-icon-circle">
            <Lock size={42} />
          </div>
          <h2>Abra un turno de caja para empezar a vender</h2>
          <p>
            Para llevar el control de la caja, no se pueden registrar ventas
            hasta abrir un turno e indicar cuánto efectivo hay al empezar.
          </p>
          <button
            type="button"
            className="touch-target btn btn-primary btn-lg"
            onClick={() => navigate('/turno')}
          >
            <Unlock size={20} />
            <span>Ir a Abrir Turno de Caja Ahora</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pos-workspace">
      {/* COLUMNA IZQUIERDA: Mostrador / Catálogo Táctil de Productos (US-07, US-12) */}
      <section className="pos-catalog-pane">
        <div className="pos-search-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="search"
              className="touch-target form-input"
              placeholder="Buscar producto por nombre (Ej. Arroz, Leche)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="barcode-input-wrapper">
            <Barcode size={18} className="search-icon" />
            <input
              type="text"
              className="touch-target form-input"
              placeholder="Escanear o digitar EAN + Enter"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
            />
          </form>
        </div>

        {/* Pestañas Táctiles de Categorías (>= 48x48px) */}
        <div className="category-pills" role="tablist" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={`touch-target category-pill ${
              categoriaActiva === undefined ? 'active' : ''
            }`}
            onClick={() => setCategoriaActiva(undefined)}
          >
            Todos los Productos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id_categoria}
              type="button"
              className={`touch-target category-pill ${
                categoriaActiva === cat.id_categoria ? 'active' : ''
              }`}
              onClick={() => setCategoriaActiva(cat.id_categoria)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {feedbackBanner && (
          <div
            className={`alert-banner ${
              feedbackBanner.tipo === 'error'
                ? 'alert-danger'
                : feedbackBanner.tipo === 'warning'
                  ? 'alert-warning'
                  : 'alert-success'
            }`}
          >
            {feedbackBanner.tipo === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>{feedbackBanner.texto}</span>
          </div>
        )}

        {/* Cuadrícula Táctil de Artículos */}
        {cargandoCatalogo ? (
          <div className="empty-state">Cargando estantería de productos...</div>
        ) : productos.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={36} />
            <p>No se encontraron productos activos para este filtro.</p>
          </div>
        ) : (
          <div className="product-touch-grid">
            {productos.map((prod) => {
              const sinStock = prod.stock_actual <= 0
              const stockCritico =
                !sinStock && prod.stock_actual <= prod.stock_minimo
              const enCarrito = items.find(
                (i) => i.id_producto === prod.id_producto,
              )

              return (
                <button
                  key={prod.id_producto}
                  type="button"
                  className={`touch-target product-tile ${
                    sinStock ? 'tile-out-of-stock' : ''
                  } ${enCarrito ? 'tile-selected' : ''}`}
                  onClick={() => handleSeleccionarProducto(prod)}
                  disabled={sinStock}
                >
                  <div className="tile-top-row">
                    <span className="tile-category">{prod.nombre_categoria}</span>
                    <span
                      className={`stock-badge ${
                        sinStock
                          ? 'stock-empty'
                          : stockCritico
                            ? 'stock-low'
                            : 'stock-ok'
                      }`}
                    >
                      {sinStock
                        ? 'Agotado'
                        : `${prod.stock_actual} ${prod.unidad_medida}`}
                    </span>
                  </div>

                  <div className="tile-name">{prod.nombre}</div>

                  <div className="tile-bottom-row">
                    <strong className="tile-price">
                      {formatCOP(prod.precio_venta)}
                    </strong>
                    {prod.aplica_iva && (
                      <span className="tile-iva">IVA {prod.porcentaje_iva}%</span>
                    )}
                  </div>

                  {enCarrito && (
                    <div className="tile-cart-counter">
                      {enCarrito.cantidad} en cuenta
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* COLUMNA DERECHA: Carrito / Cuenta Activa en Tiempo Real (US-12, US-13) */}
      <aside className="pos-cart-pane" ref={setCartPane}>
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={20} />
            <h2>Cuenta Actual ({totalUnidades})</h2>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              className="touch-target btn-text-danger"
              onClick={vaciarCarrito}
            >
              <Trash2 size={16} /> Vaciar
            </button>
          )}
        </div>

        <div className="cart-items-list">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={40} />
              <p>Toque cualquier producto o escanee su código de barras</p>
              <span>Los subtotales e IVA se liquidarán al instante.</span>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id_producto} className="cart-item-row">
                <div className="cart-item-info">
                  <strong>{item.nombre}</strong>
                  <span>
                    {formatCOP(item.precio_unitario)} c/u
                    {item.aplica_iva ? ` (+IVA ${item.porcentaje_iva}%)` : ''}
                  </span>
                </div>

                <div className="cart-item-controls">
                  <button
                    type="button"
                    className="touch-target qty-btn"
                    onClick={() =>
                      cambiarCantidad(item.id_producto, item.cantidad - 1)
                    }
                    aria-label={`Disminuir cantidad de ${item.nombre}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-display">{item.cantidad}</span>
                  <button
                    type="button"
                    className="touch-target qty-btn"
                    onClick={() =>
                      cambiarCantidad(item.id_producto, item.cantidad + 1)
                    }
                    disabled={item.cantidad >= item.stock_disponible}
                    aria-label={`Aumentar cantidad de ${item.nombre}`}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="touch-target qty-btn qty-btn-remove"
                    onClick={() => eliminarItem(item.id_producto)}
                    aria-label={`Eliminar ${item.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  {formatCOP(item.subtotal_linea + item.impuesto_linea)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary-footer">
          <div className="summary-row">
            <span>Subtotal Base:</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>IVA Discriminado:</span>
            <span>{formatCOP(impuestoTotal)}</span>
          </div>
          <div className="summary-row summary-discount-row">
            <label htmlFor="descuento-global-input">Descuento ($):</label>
            <input
              id="descuento-global-input"
              type="number"
              min={0}
              step="100"
              className="form-input-sm"
              value={descuentoGlobal || ''}
              placeholder="0"
              onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
              disabled={items.length === 0}
            />
          </div>
          <div className="summary-row summary-total-row">
            <span>TOTAL A COBRAR:</span>
            <strong>{formatCOP(totalAPagar)}</strong>
          </div>

          <button
            type="button"
            className="touch-target btn btn-primary btn-lg btn-block btn-checkout"
            disabled={items.length === 0}
            onClick={abrirModalCobro}
          >
            <Banknote size={22} />
            <span>Liquidar y Cobrar {formatCOP(totalAPagar)}</span>
          </button>
        </div>
      </aside>

      {items.length > 0 && !cartVisible && !mostrarCheckout && (
        <button
          type="button"
          className="touch-target btn btn-primary cart-fab no-print"
          onClick={irAlCarrito}
        >
          <ShoppingCart size={20} />
          <span>
            Ver cuenta · {formatCOP(totalAPagar)}
          </span>
        </button>
      )}

      {/* Modal de Liquidación Multimedio y Cálculo Automático de Vuelto (US-13, US-14) */}
      {mostrarCheckout && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div className="modal-title-group">
                <Banknote size={22} />
                <h3>Cobrar venta</h3>
              </div>
            </div>

            <form onSubmit={handleConfirmarVenta} className="form-stack">
              {/* Selector Táctil de Medio de Pago */}
              <div className="payment-methods-grid">
                <button
                  type="button"
                  className={`touch-target payment-method-card ${
                    medioPago === 'EFECTIVO' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setMedioPago('EFECTIVO')
                    setMontoRecibido(totalAPagar)
                  }}
                >
                  <Banknote size={24} />
                  <strong>Efectivo</strong>
                  <span>Cálculo de devuelta</span>
                </button>

                <button
                  type="button"
                  className={`touch-target payment-method-card ${
                    medioPago === 'TRANSFERENCIA' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setMedioPago('TRANSFERENCIA')
                    setMontoRecibido(totalAPagar)
                  }}
                >
                  <Smartphone size={24} />
                  <strong>Transferencia</strong>
                  <span>Nequi / Daviplata / QR</span>
                </button>

                <button
                  type="button"
                  className={`touch-target payment-method-card ${
                    medioPago === 'TARJETA' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setMedioPago('TARJETA')
                    setMontoRecibido(totalAPagar)
                  }}
                >
                  <CreditCard size={24} />
                  <strong>Tarjeta</strong>
                  <span>Débito / Crédito</span>
                </button>
              </div>

              {medioPago === 'EFECTIVO' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="monto-recibido-input">
                      Efectivo Recibido del Cliente ($ COP)
                    </label>
                    <input
                      id="monto-recibido-input"
                      type="number"
                      min={0}
                      step="100"
                      className="touch-target form-input form-input-lg"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(Number(e.target.value))}
                      required
                    />
                  </div>

                  <BillQuickSelector
                    totalAPagar={totalAPagar}
                    montoActual={montoRecibido}
                    onSelectAmount={(val) => setMontoRecibido(val)}
                  />

                  <div
                    className={`change-callout ${
                      efectivoInsuficiente ? 'change-insufficient' : 'change-ok'
                    }`}
                  >
                    <div>
                      <span>Total Cuenta: {formatCOP(totalAPagar)}</span>
                      <h4>
                        {efectivoInsuficiente
                          ? `Monto insuficiente (Faltan ${formatCOP(
                              totalAPagar - montoRecibido,
                            )})`
                          : 'CAMBIO / VUELTO A ENTREGAR AL CLIENTE:'}
                      </h4>
                    </div>
                    {!efectivoInsuficiente && (
                      <strong className="change-amount">
                        {formatCOP(cambioCalculado)}
                      </strong>
                    )}
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="referencia-pago-input">
                    Número de Comprobante / Referencia de Pago ({medioPago}) *
                  </label>
                  <input
                    id="referencia-pago-input"
                    type="text"
                    className="touch-target form-input"
                    placeholder="Ej. Nequi-984120 o Voucher #4512"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Datos opcionales del cliente (Regla de ventas #2: por defecto CONSUMIDOR FINAL) */}
              <div className="client-optional-box">
                <span className="section-caption">
                  Datos del Cliente (Opcional — si se omite se emite a CONSUMIDOR
                  FINAL 222222222222)
                </span>
                <div className="grid-2col">
                  <input
                    type="text"
                    className="touch-target form-input"
                    placeholder="Cédula o NIT del cliente"
                    value={clienteIdentificacion}
                    onChange={(e) => setClienteIdentificacion(e.target.value)}
                  />
                  <input
                    type="text"
                    className="touch-target form-input"
                    placeholder="Nombre completo o Razón Social"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setMostrarCheckout(false)}
                  disabled={procesandoVenta}
                >
                  Volver al Carrito
                </button>
                <button
                  type="submit"
                  className="touch-target btn btn-primary btn-lg"
                  disabled={
                    procesandoVenta ||
                    efectivoInsuficiente ||
                    faltaReferenciaDigital
                  }
                >
                  <CheckCircle2 size={20} />
                  <span>
                    {procesandoVenta
                      ? 'Registrando venta...'
                      : `Confirmar Venta y Emitir Ticket (${formatCOP(
                          totalAPagar,
                        )})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprobante / Ticket Térmico emitido (US-15) */}
      {ventaReciente && (
        <ThermalTicketModal
          venta={ventaReciente}
          onClose={() => setVentaReciente(null)}
        />
      )}
    </div>
  )
}
