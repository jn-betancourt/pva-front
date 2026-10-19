import type {
  AjusteInventarioResponse,
  AlertaStockResponse,
  KardexResponse,
  MovimientoInventarioResponse,
  RegistrarAjusteRequest,
  RegistrarCompraRequest,
  TipoMovimientoInventario,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export interface KardexFiltros {
  desde?: string
  hasta?: string
  tipo?: TipoMovimientoInventario
}

export const inventarioService = {
  registrarCompra(
    payload: RegistrarCompraRequest,
  ): Promise<MovimientoInventarioResponse> {
    return apiRequest<MovimientoInventarioResponse>('/inventario/compra', {
      method: 'POST',
      body: payload,
    })
  },

  registrarAjuste(
    payload: RegistrarAjusteRequest,
  ): Promise<AjusteInventarioResponse> {
    return apiRequest<AjusteInventarioResponse>('/inventario/ajuste', {
      method: 'POST',
      body: payload,
    })
  },

  obtenerKardex(
    idProducto: number,
    filtros: KardexFiltros = {},
  ): Promise<KardexResponse> {
    return apiRequest<KardexResponse>(`/inventario/kardex/${idProducto}`, {
      method: 'GET',
      params: {
        desde: filtros.desde,
        hasta: filtros.hasta,
        tipo: filtros.tipo,
      },
    })
  },

  listarAlertas(): Promise<AlertaStockResponse[]> {
    return apiRequest<AlertaStockResponse[]>('/inventario/alertas', {
      method: 'GET',
    })
  },
}
