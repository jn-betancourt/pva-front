import type {
  AnulacionVentaResponse,
  AnularVentaRequest,
  CrearVentaRequest,
  VentaFiltros,
  VentaResponse,
  VentaResumenResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const ventasService = {
  crear(payload: CrearVentaRequest): Promise<VentaResponse> {
    return apiRequest<VentaResponse>('/ventas', {
      method: 'POST',
      body: payload,
    })
  },

  listar(filtros: VentaFiltros = {}): Promise<VentaResumenResponse[]> {
    return apiRequest<VentaResumenResponse[]>('/ventas', {
      method: 'GET',
      params: {
        id_turno: filtros.id_turno,
        desde: filtros.desde,
        hasta: filtros.hasta,
        estado: filtros.estado,
        medio_pago: filtros.medio_pago,
      },
    })
  },

  obtenerPorId(idVenta: number): Promise<VentaResponse> {
    return apiRequest<VentaResponse>(`/ventas/${idVenta}`, {
      method: 'GET',
    })
  },

  anular(
    idVenta: number,
    payload: AnularVentaRequest,
  ): Promise<AnulacionVentaResponse> {
    return apiRequest<AnulacionVentaResponse>(`/ventas/${idVenta}/anular`, {
      method: 'PATCH',
      body: payload,
    })
  },
}
