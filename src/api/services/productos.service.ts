import type {
  ActualizarProductoRequest,
  CrearProductoRequest,
  CrearProductoResponse,
  InactivarProductoResponse,
  ProductoBarcodeResponse,
  ProductoFiltros,
  ProductoResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const productosService = {
  listar(filtros: ProductoFiltros = {}): Promise<ProductoResponse[]> {
    return apiRequest<ProductoResponse[]>('/productos', {
      method: 'GET',
      params: {
        id_categoria: filtros.id_categoria,
        activo: filtros.activo ?? true,
        stock_bajo: filtros.stock_bajo,
        q: filtros.q,
      },
    })
  },

  buscarPorBarcode(codigoBarras: string): Promise<ProductoBarcodeResponse> {
    return apiRequest<ProductoBarcodeResponse>(
      `/productos/barcode/${encodeURIComponent(codigoBarras.trim())}`,
      {
        method: 'GET',
      },
    )
  },

  obtenerPorId(idProducto: number): Promise<ProductoResponse> {
    return apiRequest<ProductoResponse>(`/productos/${idProducto}`, {
      method: 'GET',
    })
  },

  crear(payload: CrearProductoRequest): Promise<CrearProductoResponse> {
    return apiRequest<CrearProductoResponse>('/productos', {
      method: 'POST',
      body: payload,
    })
  },

  actualizar(
    idProducto: number,
    payload: ActualizarProductoRequest,
  ): Promise<ProductoResponse> {
    return apiRequest<ProductoResponse>(`/productos/${idProducto}`, {
      method: 'PUT',
      body: payload,
    })
  },

  inactivar(idProducto: number): Promise<InactivarProductoResponse> {
    return apiRequest<InactivarProductoResponse>(
      `/productos/${idProducto}/inactivar`,
      {
        method: 'PATCH',
      },
    )
  },
}
