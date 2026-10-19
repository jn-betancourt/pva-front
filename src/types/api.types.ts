// Contratos exactos sincronizados con los DTOs de Spring Boot (com.pva.app.dto.*)

export type RolOperario = 'CAJERO' | 'ADMIN'
export type EstadoTurno = 'ABIERTO' | 'CERRADO'
export type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
export type EstadoVenta = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA'
export type EstadoFactura = 'EMITIDA' | 'ANULADA'
export type TipoMovimientoInventario =
  | 'COMPRA'
  | 'VENTA'
  | 'AJUSTE_ENTRADA'
  | 'AJUSTE_SALIDA'

export interface ApiErrorResponse {
  error: string
  codigo: string
  detalle: string | null
}

// ==========================================
// MÓDULO 1: AUTENTICACIÓN (/api/v1/auth)
// ==========================================

export interface LoginRequest {
  nombre_usuario: string
  pin: string
}

export interface LoginTurnoActivoResponse {
  id_turno: number | null
  estado: EstadoTurno | null
  fecha_apertura: string | null
}

export interface LoginResponse {
  token: string
  id_operario: number
  nombre_completo: string
  nombre_usuario: string
  rol: RolOperario
  turno_activo: LoginTurnoActivoResponse | null
}

// ==========================================
// MÓDULO 2: OPERARIOS (/api/v1/operarios)
// ==========================================

export interface OperarioResponse {
  id_operario: number
  nombre_completo: string
  numero_documento: string
  telefono: string | null
  nombre_usuario: string
  rol: RolOperario
  activo: boolean
  intentos_fallidos: number
  creado_en: string
  actualizado_en?: string
}

export interface CrearOperarioRequest {
  nombre_completo: string
  numero_documento: string
  telefono?: string | null
  nombre_usuario: string
  pin: string
  rol: RolOperario
}

export interface OperarioCreadoResponse {
  id_operario: number
  nombre_completo: string
  nombre_usuario: string
  rol: RolOperario
  activo: boolean
  creado_en: string
}

export interface ActualizarOperarioRequest {
  nombre_completo?: string | null
  telefono?: string | null
  nombre_usuario?: string | null
  rol?: RolOperario | null
}

export interface ActualizarPinRequest {
  pin_nuevo: string
}

export interface OperarioPinResponse {
  mensaje: string
  id_operario: number
}

export interface OperarioDesbloqueadoResponse {
  mensaje: string
  id_operario: number
  intentos_fallidos: number
}

export interface OperarioInactivadoResponse {
  mensaje: string
  id_operario: number
  activo: boolean
}

// ==========================================
// MÓDULO 3: TURNOS DE CAJA (/api/v1/turnos)
// ==========================================

export interface TurnoActivoResponse {
  id_turno: number | null
  id_operario?: number | null
  nombre_operario?: string | null
  base_efectivo_inicial?: number | null
  total_efectivo_ventas?: number | null
  total_digital_ventas?: number | null
  estado: EstadoTurno | null
  fecha_apertura?: string | null
  mensaje?: string | null
}

export interface AbrirTurnoRequest {
  base_efectivo_inicial: number
}

export interface CerrarTurnoRequest {
  monto_fisico_arqueo: number
  observaciones_cierre?: string | null
}

export interface TurnoResponse {
  id_turno: number
  id_operario: number
  nombre_operario: string
  base_efectivo_inicial: number
  total_efectivo_ventas: number
  total_digital_ventas: number
  monto_fisico_arqueo: number | null
  discrepancia: number | null
  estado: EstadoTurno
  observaciones_cierre: string | null
  fecha_apertura: string
  fecha_cierre: string | null
}

// ==========================================
// MÓDULO 5: PRODUCTOS (/api/v1/productos)
// ==========================================

export interface ProductoResponse {
  id_producto: number
  codigo_barras: string | null
  nombre: string
  descripcion: string | null
  id_categoria: number
  nombre_categoria: string
  precio_venta: number
  costo_promedio: number
  aplica_iva: boolean
  porcentaje_iva: number
  stock_actual: number
  stock_minimo: number
  unidad_medida: string
  activo: boolean
  creado_en?: string
  actualizado_en?: string
}

export interface ProductoBarcodeResponse {
  id_producto: number
  codigo_barras: string
  nombre: string
  precio_venta: number
  aplica_iva: boolean
  porcentaje_iva: number
  stock_actual: number
  unidad_medida: string
}

export interface CrearProductoRequest {
  codigo_barras?: string | null
  nombre: string
  descripcion?: string | null
  id_categoria: number
  precio_venta: number
  costo_inicial: number
  stock_inicial: number
  aplica_iva: boolean
  porcentaje_iva: number
  stock_minimo: number
  unidad_medida: string
}

export interface CrearProductoResponse {
  id_producto: number
  nombre: string
  codigo_barras: string | null
  stock_actual: number
  costo_promedio: number
  activo: boolean
  creado_en: string
}

export interface ActualizarProductoRequest {
  codigo_barras?: string | null
  nombre: string
  descripcion?: string | null
  id_categoria: number
  precio_venta: number
  aplica_iva: boolean
  porcentaje_iva: number
  stock_minimo: number
  unidad_medida: string
}

export interface InactivarProductoResponse {
  mensaje: string
  id_producto: number
  activo: boolean
}

export interface ProductoFiltros {
  id_categoria?: number
  activo?: boolean
  stock_bajo?: boolean
  q?: string
}

// ==========================================
// MÓDULO 6: CATEGORÍAS (/api/v1/categorias)
// ==========================================

export interface CategoriaResponse {
  id_categoria: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface CrearCategoriaRequest {
  nombre: string
  descripcion?: string | null
}

export interface ActualizarCategoriaRequest {
  nombre: string
  descripcion?: string | null
}

export interface InactivarCategoriaResponse {
  mensaje: string
  id_categoria: number
  activo: boolean
}

// ==========================================
// MÓDULO 7: INVENTARIO Y KARDEX (/api/v1/inventario)
// ==========================================

export interface RegistrarCompraRequest {
  id_producto: number
  cantidad: number
  costo_unitario: number
  id_referencia?: string | null
  motivo_ajuste?: string | null
}

export interface MovimientoInventarioResponse {
  id_movimiento: number
  id_producto: number
  nombre_producto: string
  tipo_movimiento: TipoMovimientoInventario
  cantidad: number
  costo_unitario: number
  costo_total: number
  saldo_resultante: number
  nuevo_costo_promedio: number
  fecha_movimiento: string
}

export interface RegistrarAjusteRequest {
  id_producto: number
  tipo_movimiento: 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'
  cantidad: number
  costo_unitario: number
  motivo_ajuste: string
  id_referencia?: string | null
}

export interface AjusteInventarioResponse {
  id_movimiento: number
  id_producto: number
  nombre_producto: string
  tipo_movimiento: 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'
  cantidad: number
  costo_unitario: number
  costo_total: number
  saldo_resultante: number
  motivo_ajuste: string
  fecha_movimiento: string
}

export interface KardexMovimientoItem {
  id_movimiento: number
  tipo_movimiento: TipoMovimientoInventario
  cantidad: number
  costo_unitario: number
  costo_total: number
  saldo_resultante: number
  id_referencia: string | null
  motivo_ajuste: string | null
  nombre_operario: string
  fecha_movimiento: string
}

export interface KardexResponse {
  id_producto: number
  nombre_producto: string
  stock_actual: number
  costo_promedio: number
  movimientos: KardexMovimientoItem[]
}

export interface AlertaStockResponse {
  id_producto: number
  nombre: string
  codigo_barras: string | null
  stock_actual: number
  stock_minimo: number
  deficit: number
}

// ==========================================
// MÓDULO 8: VENTAS / POS (/api/v1/ventas)
// ==========================================

export interface CrearVentaItemRequest {
  id_producto: number
  cantidad: number
  descuento_linea?: number
}

export interface CrearVentaClienteRequest {
  identificacion?: string | null
  nombre?: string | null
  direccion?: string | null
  telefono?: string | null
}

export interface CrearVentaRequest {
  uuid_offline?: string | null
  id_turno: number
  items: CrearVentaItemRequest[]
  descuento_global?: number
  medio_pago: MedioPago
  monto_recibido: number
  referencia_pago?: string | null
  cliente?: CrearVentaClienteRequest | null
}

export interface VentaFacturaResumen {
  id_factura: number
  numero_ticket: string
  cliente_nombre: string
  cliente_identificacion: string
  monto_total: number
  total_impuestos: number
  estado: EstadoFactura
  fecha_emision: string
}

export interface VentaDetalleItemResponse {
  id_detalle: number
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  descuento_linea: number
  porcentaje_iva: number
  impuesto_linea: number
  subtotal_linea: number
}

export interface VentaResponse {
  id_venta: number
  uuid_offline: string | null
  subtotal: number
  descuento_global: number
  impuesto_total: number
  total_a_pagar: number
  monto_recibido: number
  cambio_entregado: number
  medio_pago: MedioPago
  estado: EstadoVenta
  fecha_venta: string
  factura: VentaFacturaResumen
  items: VentaDetalleItemResponse[]
}

export interface VentaResumenResponse {
  id_venta: number
  numero_ticket: string | null
  nombre_operario: string
  total_a_pagar: number
  medio_pago: MedioPago
  estado: EstadoVenta
  fecha_venta: string
}

export interface AnularVentaRequest {
  motivo_anulacion: string
}

export interface AnulacionVentaResponse {
  id_venta: number
  estado: EstadoVenta
  factura: {
    id_factura: number
    numero_ticket: string
    estado: EstadoFactura
    motivo_anulacion: string
  }
  mensaje: string
}

export interface VentaFiltros {
  id_turno?: number
  desde?: string
  hasta?: string
  estado?: EstadoVenta
  medio_pago?: MedioPago
}

// ==========================================
// MÓDULO 9: FACTURAS (/api/v1/facturas)
// ==========================================

export interface FacturaResumenResponse {
  id_factura: number
  numero_ticket: string
  cliente_nombre: string
  cliente_identificacion: string
  monto_total: number
  estado: EstadoFactura
  fecha_emision: string
}

export interface FacturaDetalleResponse {
  id_factura: number
  numero_ticket: string
  id_venta: number
  cliente_identificacion: string
  cliente_nombre: string
  cliente_direccion: string | null
  cliente_telefono: string | null
  monto_total: number
  total_impuestos: number
  estado: EstadoFactura
  motivo_anulacion: string | null
  fecha_emision: string
  negocio: {
    nombre_establecimiento: string
    nit_rut: string
    direccion: string
    telefono_contacto: string
    pie_ticket: string | null
  }
  items: {
    nombre_producto: string
    cantidad: number
    precio_unitario: number
    descuento_linea: number
    porcentaje_iva: number
    impuesto_linea: number
    subtotal_linea: number
  }[]
}

export interface FacturaFiltros {
  numero_ticket?: string
  cliente_identificacion?: string
  desde?: string
  hasta?: string
  estado?: EstadoFactura
}
