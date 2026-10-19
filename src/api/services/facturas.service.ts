import type {
  FacturaDetalleResponse,
  FacturaFiltros,
  FacturaResumenResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const facturasService = {
  listar(filtros: FacturaFiltros = {}): Promise<FacturaResumenResponse[]> {
    return apiRequest<FacturaResumenResponse[]>('/facturas', {
      method: 'GET',
      params: {
        numero_ticket: filtros.numero_ticket,
        cliente_identificacion: filtros.cliente_identificacion,
        desde: filtros.desde,
        hasta: filtros.hasta,
        estado: filtros.estado,
      },
    })
  },

  obtenerPorId(idFactura: number): Promise<FacturaDetalleResponse> {
    return apiRequest<FacturaDetalleResponse>(`/facturas/${idFactura}`, {
      method: 'GET',
    })
  },
}
