import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ProductoBarcodeResponse,
  ProductoResponse,
} from '../types/api.types'

export interface CartItem {
  id_producto: number
  nombre: string
  codigo_barras: string | null
  precio_unitario: number // Congelado al agregar al carrito (RN-VTA-02)
  aplica_iva: boolean
  porcentaje_iva: number
  unidad_medida: string
  stock_disponible: number
  cantidad: number
  descuento_linea: number
  subtotal_linea: number
  impuesto_linea: number
}

interface CartContextValue {
  items: CartItem[]
  descuentoGlobal: number
  subtotal: number
  impuestoTotal: number
  totalAPagar: number
  totalUnidades: number
  setDescuentoGlobal: (valor: number) => void
  agregarProducto: (
    producto: ProductoResponse | ProductoBarcodeResponse,
  ) => { ok: boolean; mensaje?: string }
  cambiarCantidad: (idProducto: number, nuevaCantidad: number) => void
  cambiarDescuentoLinea: (idProducto: number, descuento: number) => void
  eliminarItem: (idProducto: number) => void
  vaciarCarrito: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function recalcularItem(item: Omit<CartItem, 'subtotal_linea' | 'impuesto_linea'>): CartItem {
  const precioNetoUnitario = Math.max(
    0,
    item.precio_unitario - item.descuento_linea,
  )
  const subtotal_linea = Math.round(precioNetoUnitario * item.cantidad * 100) / 100
  const impuesto_linea = item.aplica_iva
    ? Math.round(subtotal_linea * (item.porcentaje_iva / 100) * 100) / 100
    : 0
  return {
    ...item,
    subtotal_linea,
    impuesto_linea,
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [descuentoGlobal, setDescuentoGlobalState] = useState<number>(0)

  const agregarProducto = useCallback(
    (
      producto: ProductoResponse | ProductoBarcodeResponse,
    ): { ok: boolean; mensaje?: string } => {
      if (producto.stock_actual <= 0) {
        return {
          ok: false,
          mensaje: `El producto "${producto.nombre}" no tiene existencias disponibles.`,
        }
      }

      const existente = items.find((i) => i.id_producto === producto.id_producto)
      if (existente && existente.cantidad + 1 > producto.stock_actual) {
        return {
          ok: false,
          mensaje: `Stock máximo alcanzado (${producto.stock_actual} ${producto.unidad_medida}) para "${producto.nombre}".`,
        }
      }

      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id_producto === producto.id_producto)
        if (idx >= 0) {
          const actual = prev[idx]
          const nuevaCantidad = Math.min(
            actual.stock_disponible,
            actual.cantidad + 1,
          )
          const copia = [...prev]
          copia[idx] = recalcularItem({
            ...actual,
            cantidad: nuevaCantidad,
          })
          return copia
        }
        return [
          ...prev,
          recalcularItem({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            codigo_barras: producto.codigo_barras,
            precio_unitario: Number(producto.precio_venta),
            aplica_iva: Boolean(producto.aplica_iva),
            porcentaje_iva: Number(producto.porcentaje_iva ?? 0),
            unidad_medida: producto.unidad_medida || 'UND',
            stock_disponible: producto.stock_actual,
            cantidad: 1,
            descuento_linea: 0,
          }),
        ]
      })

      return { ok: true }
    },
    [items],
  )

  const cambiarCantidad = useCallback(
    (idProducto: number, nuevaCantidad: number) => {
      if (nuevaCantidad <= 0) {
        setItems((prev) => prev.filter((i) => i.id_producto !== idProducto))
        return
      }
      setItems((prev) =>
        prev.map((item) => {
          if (item.id_producto !== idProducto) return item
          const cantidadSegura = Math.min(item.stock_disponible, nuevaCantidad)
          return recalcularItem({ ...item, cantidad: cantidadSegura })
        }),
      )
    },
    [],
  )

  const cambiarDescuentoLinea = useCallback(
    (idProducto: number, descuento: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id_producto !== idProducto) return item
          const descSeguro = Math.max(
            0,
            Math.min(item.precio_unitario, Number(descuento) || 0),
          )
          return recalcularItem({ ...item, descuento_linea: descSeguro })
        }),
      )
    },
    [],
  )

  const eliminarItem = useCallback((idProducto: number) => {
    setItems((prev) => prev.filter((i) => i.id_producto !== idProducto))
  }, [])

  const vaciarCarrito = useCallback(() => {
    setItems([])
    setDescuentoGlobalState(0)
  }, [])

  const setDescuentoGlobal = useCallback((valor: number) => {
    setDescuentoGlobalState(Math.max(0, Number(valor) || 0))
  }, [])

  const { subtotal, impuestoTotal, totalAPagar, totalUnidades } = useMemo(() => {
    const sub = items.reduce((acc, i) => acc + i.subtotal_linea, 0)
    const imp = items.reduce((acc, i) => acc + i.impuesto_linea, 0)
    const unidades = items.reduce((acc, i) => acc + i.cantidad, 0)
    const descAplicado = Math.min(sub, descuentoGlobal)
    const total = Math.max(0, Math.round((sub - descAplicado + imp) * 100) / 100)
    return {
      subtotal: Math.round(sub * 100) / 100,
      impuestoTotal: Math.round(imp * 100) / 100,
      totalAPagar: total,
      totalUnidades: unidades,
    }
  }, [items, descuentoGlobal])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      descuentoGlobal,
      subtotal,
      impuestoTotal,
      totalAPagar,
      totalUnidades,
      setDescuentoGlobal,
      agregarProducto,
      cambiarCantidad,
      cambiarDescuentoLinea,
      eliminarItem,
      vaciarCarrito,
    }),
    [
      items,
      descuentoGlobal,
      subtotal,
      impuestoTotal,
      totalAPagar,
      totalUnidades,
      setDescuentoGlobal,
      agregarProducto,
      cambiarCantidad,
      cambiarDescuentoLinea,
      eliminarItem,
      vaciarCarrito,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe utilizarse dentro de CartProvider')
  }
  return ctx
}
