import {
  AlertTriangle,
  ArchiveRestore,
  BookOpen,
  Boxes,
  CheckCircle2,
  Edit3,
  FolderPlus,
  PackagePlus,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PvaApiError } from '../../api/httpClient'
import { categoriasService } from '../../api/services/categorias.service'
import { inventarioService } from '../../api/services/inventario.service'
import { productosService } from '../../api/services/productos.service'
import type {
  AlertaStockResponse,
  CategoriaResponse,
  KardexResponse,
  ProductoResponse,
  TipoMovimientoInventario,
} from '../../types/api.types'
import { formatCOP, formatDateTime } from '../../utils/formatters'

type InventarioSubTab = 'catalogo' | 'alertas' | 'kardex' | 'categorias'

export function InventarioPage() {
  const [subTab, setSubTab] = useState<InventarioSubTab>('catalogo')

  // Datos principales
  const [productos, setProductos] = useState<ProductoResponse[]>([])
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([])
  const [alertas, setAlertas] = useState<AlertaStockResponse[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState<number | undefined>(undefined)
  const [cargando, setCargando] = useState(false)

  // Estado Kardex (US-11)
  const [idProductoKardex, setIdProductoKardex] = useState<number | ''>('')
  const [filtroTipoKardex, setFiltroTipoKardex] = useState<
    TipoMovimientoInventario | ''
  >('')
  const [kardexData, setKardexData] = useState<KardexResponse | null>(null)
  const [cargandoKardex, setCargandoKardex] = useState(false)

  // Modal Crear / Editar Producto (US-06)
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false)
  const [productoEditando, setProductoEditando] =
    useState<ProductoResponse | null>(null)
  const [prodForm, setProdForm] = useState({
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    id_categoria: 0,
    precio_venta: 0,
    costo_inicial: 0,
    stock_inicial: 0,
    aplica_iva: false,
    porcentaje_iva: 19,
    stock_minimo: 5,
    unidad_medida: 'UNIDAD',
  })

  // Modal Abastecimiento / Compra Proveedor con CPP (US-08)
  const [productoCompra, setProductoCompra] =
    useState<ProductoResponse | null>(null)
  const [compraForm, setCompraForm] = useState({
    cantidad: 10,
    costo_unitario: 0,
    id_referencia: '',
    motivo_ajuste: 'Recepción de pedido de proveedor',
  })

  // Modal Ajuste Manual por Merma / Avería (US-10)
  const [productoAjuste, setProductoAjuste] =
    useState<ProductoResponse | null>(null)
  const [ajusteForm, setAjusteForm] = useState<{
    tipo_movimiento: 'AJUSTE_SALIDA' | 'AJUSTE_ENTRADA'
    cantidad: number
    costo_unitario: number
    motivo_ajuste: string
    id_referencia: string
  }>({
    tipo_movimiento: 'AJUSTE_SALIDA',
    cantidad: 1,
    costo_unitario: 0,
    motivo_ajuste: '',
    id_referencia: '',
  })

  // Formulario Categorías (US-06)
  const [catNombre, setCatNombre] = useState('')
  const [catDescripcion, setCatDescripcion] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const cargarTodoInventario = useCallback(async () => {
    setCargando(true)
    setErrorMsg(null)
    try {
      const [prods, cats, alts] = await Promise.all([
        productosService.listar({
          id_categoria: filtroCat,
          q: busqueda.trim() || undefined,
          activo: true,
        }),
        categoriasService.listar(true),
        inventarioService.listarAlertas(),
      ])
      setProductos(prods)
      setCategorias(cats)
      setAlertas(alts)
      if (prods.length > 0 && !idProductoKardex) {
        setIdProductoKardex(prods[0].id_producto)
      }
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'Error cargando datos de inventario',
      )
    } finally {
      setCargando(false)
    }
  }, [filtroCat, busqueda, idProductoKardex])

  useEffect(() => {
    queueMicrotask(() => {
      void cargarTodoInventario()
    })
  }, [cargarTodoInventario])

  const consultarKardexProducto = useCallback(
    async (idProd: number, tipo?: TipoMovimientoInventario | '') => {
      setCargandoKardex(true)
      setErrorMsg(null)
      try {
        const resp = await inventarioService.obtenerKardex(idProd, {
          tipo: tipo || undefined,
        })
        setKardexData(resp)
      } catch (err) {
        setErrorMsg(
          err instanceof PvaApiError
            ? err.message
            : 'No fue posible consultar el Kardex del producto',
        )
      } finally {
        setCargandoKardex(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (subTab === 'kardex' && idProductoKardex) {
      queueMicrotask(() => {
        void consultarKardexProducto(
          Number(idProductoKardex),
          filtroTipoKardex,
        )
      })
    }
  }, [subTab, idProductoKardex, filtroTipoKardex, consultarKardexProducto])

  const abrirNuevoProducto = () => {
    setProductoEditando(null)
    setProdForm({
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      id_categoria: categorias[0]?.id_categoria ?? 1,
      precio_venta: 0,
      costo_inicial: 0,
      stock_inicial: 0,
      aplica_iva: false,
      porcentaje_iva: 19,
      stock_minimo: 5,
      unidad_medida: 'UNIDAD',
    })
    setMostrarModalProducto(true)
  }

  const abrirEditarProducto = (prod: ProductoResponse) => {
    setProductoEditando(prod)
    setProdForm({
      codigo_barras: prod.codigo_barras ?? '',
      nombre: prod.nombre,
      descripcion: prod.descripcion ?? '',
      id_categoria: prod.id_categoria,
      precio_venta: prod.precio_venta,
      costo_inicial: prod.costo_promedio,
      stock_inicial: prod.stock_actual,
      aplica_iva: prod.aplica_iva,
      porcentaje_iva: prod.porcentaje_iva || 19,
      stock_minimo: prod.stock_minimo,
      unidad_medida: prod.unidad_medida || 'UNIDAD',
    })
    setMostrarModalProducto(true)
  }

  const handleGuardarProducto = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      if (productoEditando) {
        await productosService.actualizar(productoEditando.id_producto, {
          codigo_barras: prodForm.codigo_barras.trim() || null,
          nombre: prodForm.nombre.trim(),
          descripcion: prodForm.descripcion.trim() || null,
          id_categoria: Number(prodForm.id_categoria),
          precio_venta: Number(prodForm.precio_venta),
          aplica_iva: prodForm.aplica_iva,
          porcentaje_iva: prodForm.aplica_iva
            ? Number(prodForm.porcentaje_iva)
            : 0,
          stock_minimo: Number(prodForm.stock_minimo),
          unidad_medida: prodForm.unidad_medida.trim() || 'UNIDAD',
        })
        setSuccessMsg(`Producto "${prodForm.nombre}" actualizado correctamente.`)
      } else {
        await productosService.crear({
          codigo_barras: prodForm.codigo_barras.trim() || null,
          nombre: prodForm.nombre.trim(),
          descripcion: prodForm.descripcion.trim() || null,
          id_categoria: Number(prodForm.id_categoria),
          precio_venta: Number(prodForm.precio_venta),
          costo_inicial: Number(prodForm.costo_inicial),
          stock_inicial: Number(prodForm.stock_inicial),
          aplica_iva: prodForm.aplica_iva,
          porcentaje_iva: prodForm.aplica_iva
            ? Number(prodForm.porcentaje_iva)
            : 0,
          stock_minimo: Number(prodForm.stock_minimo),
          unidad_medida: prodForm.unidad_medida.trim() || 'UNIDAD',
        })
        setSuccessMsg(`Producto "${prodForm.nombre}" registrado en el catálogo.`)
      }
      setMostrarModalProducto(false)
      void cargarTodoInventario()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` (${err.detalle})` : ''}`
          : 'Error guardando el producto',
      )
    }
  }

  const handleInactivarProducto = async (prod: ProductoResponse) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await productosService.inactivar(prod.id_producto)
      setSuccessMsg(`${resp.mensaje} (${prod.nombre})`)
      void cargarTodoInventario()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No se pudo inactivar el producto',
      )
    }
  }

  const handleRegistrarCompra = async (e: FormEvent) => {
    e.preventDefault()
    if (!productoCompra) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await inventarioService.registrarCompra({
        id_producto: productoCompra.id_producto,
        cantidad: Number(compraForm.cantidad),
        costo_unitario: Number(compraForm.costo_unitario),
        id_referencia: compraForm.id_referencia.trim() || null,
        motivo_ajuste: compraForm.motivo_ajuste.trim() || null,
      })
      setSuccessMsg(
        `Abastecimiento asentado para "${resp.nombre_producto}": Nuevo stock = ${
          resp.saldo_resultante
        } uds | Nuevo costo promedio = ${formatCOP(
          resp.nuevo_costo_promedio,
        )}`,
      )
      setProductoCompra(null)
      void cargarTodoInventario()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
          : 'Error registrando abastecimiento',
      )
    }
  }

  const handleRegistrarAjuste = async (e: FormEvent) => {
    e.preventDefault()
    if (!productoAjuste || !ajusteForm.motivo_ajuste.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const resp = await inventarioService.registrarAjuste({
        id_producto: productoAjuste.id_producto,
        tipo_movimiento: ajusteForm.tipo_movimiento,
        cantidad: Number(ajusteForm.cantidad),
        costo_unitario: Number(ajusteForm.costo_unitario),
        motivo_ajuste: ajusteForm.motivo_ajuste.trim(),
        id_referencia: ajusteForm.id_referencia.trim() || null,
      })
      setSuccessMsg(
        `Ajuste (${resp.tipo_movimiento}) asentado en Kardex para "${resp.nombre_producto}". Saldo resultante: ${resp.saldo_resultante} uds.`,
      )
      setProductoAjuste(null)
      void cargarTodoInventario()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? `${err.message}${err.detalle ? ` — ${err.detalle}` : ''}`
          : 'Error aplicando el ajuste de inventario',
      )
    }
  }

  const handleCrearCategoria = async (e: FormEvent) => {
    e.preventDefault()
    if (!catNombre.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const creada = await categoriasService.crear({
        nombre: catNombre.trim(),
        descripcion: catDescripcion.trim() || null,
      })
      setSuccessMsg(`Categoría "${creada.nombre}" creada exitosamente.`)
      setCatNombre('')
      setCatDescripcion('')
      void cargarTodoInventario()
    } catch (err) {
      setErrorMsg(
        err instanceof PvaApiError
          ? err.message
          : 'No se pudo crear la categoría',
      )
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Boxes size={28} /> Bodega, Abastecimiento y Libro Mayor Kardex
          </h1>
          <p className="page-subtitle">
            Catálogo Maestro, Recepción de mercancía, Alertas de
            Stock Crítico, Mermas y Kardex Inmutable.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="touch-target btn btn-secondary"
            onClick={() => void cargarTodoInventario()}
            disabled={cargando}
          >
            <RefreshCw size={18} />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            className="touch-target btn btn-primary"
            onClick={abrirNuevoProducto}
          >
            <PlusCircle size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Sub-navegación de Inventario */}
      <div className="subnav-tabs">
        <button
          type="button"
          className={`touch-target subnav-tab ${
            subTab === 'catalogo' ? 'active' : ''
          }`}
          onClick={() => setSubTab('catalogo')}
        >
          <Boxes size={18} />
          <span>Catálogo Maestro ({productos.length})</span>
        </button>

        <button
          type="button"
          className={`touch-target subnav-tab ${
            subTab === 'alertas' ? 'active' : ''
          }`}
          onClick={() => setSubTab('alertas')}
        >
          <AlertTriangle size={18} />
          <span>Alertas de Stock Crítico ({alertas.length})</span>
        </button>

        <button
          type="button"
          className={`touch-target subnav-tab ${
            subTab === 'kardex' ? 'active' : ''
          }`}
          onClick={() => setSubTab('kardex')}
        >
          <BookOpen size={18} />
          <span>Libro Mayor Kardex</span>
        </button>

        <button
          type="button"
          className={`touch-target subnav-tab ${
            subTab === 'categorias' ? 'active' : ''
          }`}
          onClick={() => setSubTab('categorias')}
        >
          <FolderPlus size={18} />
          <span>Categorías ({categorias.length})</span>
        </button>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-danger" role="alert">
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-success" role="status">
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: CATÁLOGO MAESTRO + ACCIONES DE COMPRA Y MERMA */}
      {subTab === 'catalogo' && (
        <section className="card">
          <div className="filters-toolbar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="search"
                className="touch-target form-input"
                placeholder="Buscar producto por nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select
              className="touch-target form-input"
              value={filtroCat ?? ''}
              onChange={(e) =>
                setFiltroCat(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código EAN</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio Venta</th>
                  <th>Costo promedio</th>
                  <th>IVA</th>
                  <th>Stock / Mínimo</th>
                  <th>Operaciones de Bodega</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => {
                  const critico = prod.stock_actual <= prod.stock_minimo
                  return (
                    <tr key={prod.id_producto}>
                      <td>{prod.codigo_barras || '—'}</td>
                      <td>
                        <strong>{prod.nombre}</strong>
                      </td>
                      <td>{prod.nombre_categoria}</td>
                      <td>
                        <strong>{formatCOP(prod.precio_venta)}</strong>
                      </td>
                      <td>{formatCOP(prod.costo_promedio)}</td>
                      <td>
                        {prod.aplica_iva ? `${prod.porcentaje_iva}%` : 'Exento'}
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${
                            critico ? 'stock-low' : 'stock-ok'
                          }`}
                        >
                          {prod.stock_actual} / mín {prod.stock_minimo}{' '}
                          {prod.unidad_medida}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="touch-target btn btn-primary btn-sm"
                            onClick={() => {
                              setProductoCompra(prod)
                              setCompraForm({
                                cantidad: 10,
                                costo_unitario: prod.costo_promedio || 1000,
                                id_referencia: '',
                                motivo_ajuste: 'Compra a proveedor',
                              })
                            }}
                            title="Registrar entrada de mercancía y recalcular el costo promedio"
                          >
                            <PackagePlus size={15} />
                            <span>Abastecer</span>
                          </button>

                          <button
                            type="button"
                            className="touch-target btn btn-secondary btn-sm"
                            onClick={() => {
                              setProductoAjuste(prod)
                              setAjusteForm({
                                tipo_movimiento: 'AJUSTE_SALIDA',
                                cantidad: 1,
                                costo_unitario: prod.costo_promedio || 0,
                                motivo_ajuste: '',
                                id_referencia: '',
                              })
                            }}
                            title="Registrar baja por daño/vencimiento o ajuste"
                          >
                            <SlidersHorizontal size={15} />
                            <span>Merma/Ajuste</span>
                          </button>

                          <button
                            type="button"
                            className="touch-target btn btn-secondary btn-sm"
                            onClick={() => {
                              setIdProductoKardex(prod.id_producto)
                              setSubTab('kardex')
                            }}
                            title="Ver Libro Mayor Kardex"
                          >
                            <BookOpen size={15} />
                            <span>Kardex</span>
                          </button>

                          <button
                            type="button"
                            className="touch-target btn-icon"
                            onClick={() => abrirEditarProducto(prod)}
                            title="Editar Producto"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="touch-target btn-icon text-danger"
                            onClick={() => void handleInactivarProducto(prod)}
                            title="Baja lógica del producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: BANDEJA DE ALERTAS DE STOCK CRÍTICO (US-09 — GET /api/v1/inventario/alertas) */}
      {subTab === 'alertas' && (
        <section className="card">
          <div className="card-header">
            <AlertTriangle size={22} className="text-warning" />
            <div>
              <h2>Bandeja de Reposición Sugerida</h2>
              <p>
                Productos cuyas existencias cayeron en o por debajo de su umbral
                mínimo configurado (<code>stock_actual &lt;= stock_minimo</code>
                ).
              </p>
            </div>
          </div>

          {alertas.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={36} className="text-success" />
              <p>
                ¡Excelente! Ningún producto se encuentra en nivel crítico de
                stock.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Código de Barras</th>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Umbral Mínimo</th>
                    <th>Déficit Sugerido</th>
                    <th>Acción Rápida</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((al) => {
                    const prodCompleto = productos.find(
                      (p) => p.id_producto === al.id_producto,
                    )
                    return (
                      <tr key={al.id_producto}>
                        <td>#{al.id_producto}</td>
                        <td>{al.codigo_barras ?? '—'}</td>
                        <td>
                          <strong>{al.nombre}</strong>
                        </td>
                        <td>
                          <span className="stock-badge stock-empty">
                            {al.stock_actual} uds
                          </span>
                        </td>
                        <td>{al.stock_minimo} uds</td>
                        <td>
                          <strong className="text-danger">
                            Faltan {al.deficit} uds para el mínimo
                          </strong>
                        </td>
                        <td>
                          {prodCompleto && (
                            <button
                              type="button"
                              className="touch-target btn btn-primary btn-sm"
                              onClick={() => {
                                setProductoCompra(prodCompleto)
                                setCompraForm({
                                  cantidad: Math.max(10, al.deficit + 5),
                                  costo_unitario:
                                    prodCompleto.costo_promedio || 1000,
                                  id_referencia: '',
                                  motivo_ajuste:
                                    'Reposición por alerta de stock crítico',
                                })
                              }}
                            >
                              <ArchiveRestore size={16} />
                              <span>Abastecer Ahora</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: LIBRO MAYOR KARDEX APPEND-ONLY (US-11 — GET /api/v1/inventario/kardex/{id}) */}
      {subTab === 'kardex' && (
        <section className="card">
          <div className="filters-toolbar">
            <div className="form-group-inline">
              <label htmlFor="select-prod-kardex">Producto a Auditar:</label>
              <select
                id="select-prod-kardex"
                className="touch-target form-input"
                value={idProductoKardex}
                onChange={(e) => setIdProductoKardex(Number(e.target.value))}
              >
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    #{p.id_producto} — {p.nombre} (Stock: {p.stock_actual})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-inline">
              <label htmlFor="select-tipo-kardex">Tipo Movimiento:</label>
              <select
                id="select-tipo-kardex"
                className="touch-target form-input"
                value={filtroTipoKardex}
                onChange={(e) =>
                  setFiltroTipoKardex(
                    e.target.value as TipoMovimientoInventario | '',
                  )
                }
              >
                <option value="">Todos los movimientos</option>
                <option value="COMPRA">COMPRA (Entrada Proveedor)</option>
                <option value="VENTA">VENTA (Salida POS)</option>
                <option value="AJUSTE_ENTRADA">
                  AJUSTE_ENTRADA (Reintegro/Anulación)
                </option>
                <option value="AJUSTE_SALIDA">
                  AJUSTE_SALIDA (Merma/Daño)
                </option>
              </select>
            </div>
          </div>

          {cargandoKardex ? (
            <div className="empty-state">Consultando Libro Mayor Kardex...</div>
          ) : !kardexData ? (
            <div className="empty-state">
              Seleccione un producto para visualizar su trazabilidad histórica.
            </div>
          ) : (
            <>
              <div className="kpi-grid">
                <div className="kpi-box">
                  <span className="kpi-label">Producto Auditado</span>
                  <strong className="kpi-value">
                    {kardexData.nombre_producto}
                  </strong>
                </div>
                <div className="kpi-box">
                  <span className="kpi-label">Saldo Actual Consolidado</span>
                  <strong className="kpi-value">
                    {kardexData.stock_actual} unidades
                  </strong>
                </div>
                <div className="kpi-box">
                  <span className="kpi-label">
                    Costo promedio
                  </span>
                  <strong className="kpi-value">
                    {formatCOP(kardexData.costo_promedio)}
                  </strong>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Mov.</th>
                      <th>Fecha y Hora</th>
                      <th>Tipo Movimiento</th>
                      <th>Cantidad</th>
                      <th>Costo Unitario</th>
                      <th>Costo Total</th>
                      <th>Saldo Resultante</th>
                      <th>Referencia / Motivo</th>
                      <th>Operario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kardexData.movimientos.map((m) => (
                      <tr key={m.id_movimiento}>
                        <td>#{m.id_movimiento}</td>
                        <td>{formatDateTime(m.fecha_movimiento)}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              m.tipo_movimiento === 'COMPRA' ||
                              m.tipo_movimiento === 'AJUSTE_ENTRADA'
                                ? 'status-online'
                                : 'status-offline'
                            }`}
                          >
                            {m.tipo_movimiento}
                          </span>
                        </td>
                        <td>
                          <strong>{m.cantidad}</strong>
                        </td>
                        <td>{formatCOP(m.costo_unitario)}</td>
                        <td>{formatCOP(m.costo_total)}</td>
                        <td>
                          <strong>{m.saldo_resultante}</strong>
                        </td>
                        <td>
                          {m.id_referencia && (
                            <div>
                              <code>{m.id_referencia}</code>
                            </div>
                          )}
                          {m.motivo_ajuste && <span>{m.motivo_ajuste}</span>}
                        </td>
                        <td>{m.nombre_operario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 4: CATEGORÍAS DE PRODUCTO (/api/v1/categorias) */}
      {subTab === 'categorias' && (
        <div className="grid-2col">
          <section className="card">
            <h2>Crear Nueva Categoría</h2>
            <form onSubmit={handleCrearCategoria} className="form-stack">
              <div className="form-group">
                <label htmlFor="cat-nombre-input">Nombre de Categoría *</label>
                <input
                  id="cat-nombre-input"
                  type="text"
                  className="touch-target form-input"
                  placeholder="Ej. Bebidas, Lácteos, Aseo, Papelería"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cat-desc-input">Descripción</label>
                <input
                  id="cat-desc-input"
                  type="text"
                  className="touch-target form-input"
                  placeholder="Descripción opcional"
                  value={catDescripcion}
                  onChange={(e) => setCatDescripcion(e.target.value)}
                />
              </div>
              <button type="submit" className="touch-target btn btn-primary">
                <FolderPlus size={18} />
                <span>Guardar Categoría</span>
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Categorías Activas ({categorias.length})</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((c) => (
                    <tr key={c.id_categoria}>
                      <td>#{c.id_categoria}</td>
                      <td>
                        <strong>{c.nombre}</strong>
                      </td>
                      <td>{c.descripcion ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="touch-target btn btn-outline-danger btn-sm"
                          onClick={async () => {
                            await categoriasService.inactivar(c.id_categoria)
                            void cargarTodoInventario()
                          }}
                        >
                          Inactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO (US-06) */}
      {mostrarModalProducto && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>
                {productoEditando
                  ? `Editar Producto: ${productoEditando.nombre}`
                  : 'Registrar Nuevo Producto en Catálogo'}
              </h3>
            </div>
            <form onSubmit={handleGuardarProducto} className="form-stack">
              <div className="grid-2col">
                <div className="form-group">
                  <label>Nombre Comercial Único *</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    value={prodForm.nombre}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Código de Barras EAN/UPC (Opcional)</label>
                  <input
                    type="text"
                    className="touch-target form-input"
                    placeholder="Ej. 7701234567890"
                    value={prodForm.codigo_barras}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        codigo_barras: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    className="touch-target form-input"
                    value={prodForm.id_categoria}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        id_categoria: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unidad de Medida *</label>
                  <select
                    className="touch-target form-input"
                    value={prodForm.unidad_medida}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        unidad_medida: e.target.value,
                      })
                    }
                  >
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="KG">KG</option>
                    <option value="LITRO">LITRO</option>
                    <option value="PAQUETE">PAQUETE</option>
                    <option value="CAJA">CAJA</option>
                  </select>
                </div>
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Precio de Venta al Público ($ COP) *</label>
                  <input
                    type="number"
                    min={0}
                    step="50"
                    className="touch-target form-input"
                    value={prodForm.precio_venta}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        precio_venta: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Umbral de stock mínimo (genera alerta) *</label>
                  <input
                    type="number"
                    min={0}
                    className="touch-target form-input"
                    value={prodForm.stock_minimo}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        stock_minimo: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              {!productoEditando && (
                <div className="grid-2col">
                  <div className="form-group">
                    <label>Costo unitario inicial *</label>
                    <input
                      type="number"
                      min={0}
                      step="50"
                      className="touch-target form-input"
                      value={prodForm.costo_inicial}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          costo_inicial: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Inicial en Bodega *</label>
                    <input
                      type="number"
                      min={0}
                      className="touch-target form-input"
                      value={prodForm.stock_inicial}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          stock_inicial: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid-2col">
                <div className="form-group checkbox-group">
                  <label className="touch-target checkbox-label">
                    <input
                      type="checkbox"
                      checked={prodForm.aplica_iva}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          aplica_iva: e.target.checked,
                        })
                      }
                    />
                    <span>¿Grava Impuesto IVA?</span>
                  </label>
                </div>
                {prodForm.aplica_iva && (
                  <div className="form-group">
                    <label>Porcentaje IVA (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      className="touch-target form-input"
                      value={prodForm.porcentaje_iva}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          porcentaje_iva: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setMostrarModalProducto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="touch-target btn btn-primary">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABASTECIMIENTO / COMPRA PROVEEDOR CON CPP (US-08) */}
      {productoCompra && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                Recepción de mercancía —{' '}
                {productoCompra.nombre}
              </h3>
            </div>
            <form onSubmit={handleRegistrarCompra} className="form-stack">
              <p className="text-muted">
                Stock actual: <strong>{productoCompra.stock_actual}</strong> uds
                | Costo promedio actual:{' '}
                <strong>{formatCOP(productoCompra.costo_promedio)}</strong>
              </p>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Cantidad Entrante (&gt; 0) *</label>
                  <input
                    type="number"
                    min={1}
                    className="touch-target form-input"
                    value={compraForm.cantidad}
                    onChange={(e) =>
                      setCompraForm({
                        ...compraForm,
                        cantidad: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Costo Unitario de Compra ($ COP) *</label>
                  <input
                    type="number"
                    min={0}
                    step="50"
                    className="touch-target form-input"
                    value={compraForm.costo_unitario}
                    onChange={(e) =>
                      setCompraForm({
                        ...compraForm,
                        costo_unitario: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>N° Remisión o Factura Proveedor</label>
                <input
                  type="text"
                  className="touch-target form-input"
                  placeholder="Ej. FAC-PROV-204"
                  value={compraForm.id_referencia}
                  onChange={(e) =>
                    setCompraForm({
                      ...compraForm,
                      id_referencia: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setProductoCompra(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="touch-target btn btn-primary">
                  Registrar compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE MANUAL / MERMA (US-10 — RN-INV-05) */}
      {productoAjuste && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                Ajuste Manual / Merma de Inventario —{' '}
                {productoAjuste.nombre}
              </h3>
            </div>
            <form onSubmit={handleRegistrarAjuste} className="form-stack">
              <div className="form-group">
                <label>Tipo de Ajuste *</label>
                <select
                  className="touch-target form-input"
                  value={ajusteForm.tipo_movimiento}
                  onChange={(e) =>
                    setAjusteForm({
                      ...ajusteForm,
                      tipo_movimiento: e.target.value as
                        | 'AJUSTE_SALIDA'
                        | 'AJUSTE_ENTRADA',
                    })
                  }
                >
                  <option value="AJUSTE_SALIDA">
                    AJUSTE_SALIDA (Baja por daño, rotura o vencimiento)
                  </option>
                  <option value="AJUSTE_ENTRADA">
                    AJUSTE_ENTRADA (Sobrante hallado en conteo físico)
                  </option>
                </select>
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label>Cantidad de Unidades *</label>
                  <input
                    type="number"
                    min={1}
                    className="touch-target form-input"
                    value={ajusteForm.cantidad}
                    onChange={(e) =>
                      setAjusteForm({
                        ...ajusteForm,
                        cantidad: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Costo Unitario de Referencia ($ COP) *</label>
                  <input
                    type="number"
                    min={0}
                    className="touch-target form-input"
                    value={ajusteForm.costo_unitario}
                    onChange={(e) =>
                      setAjusteForm({
                        ...ajusteForm,
                        costo_unitario: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Motivo del ajuste (obligatorio) *
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Ej. Empaque roto en estantería o producto vencido"
                  value={ajusteForm.motivo_ajuste}
                  onChange={(e) =>
                    setAjusteForm({
                      ...ajusteForm,
                      motivo_ajuste: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="touch-target btn btn-secondary"
                  onClick={() => setProductoAjuste(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="touch-target btn btn-danger"
                  disabled={!ajusteForm.motivo_ajuste.trim()}
                >
                  Asentar Ajuste en Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
