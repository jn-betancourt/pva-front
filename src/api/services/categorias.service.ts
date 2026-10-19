import type {
  ActualizarCategoriaRequest,
  CategoriaResponse,
  CrearCategoriaRequest,
  InactivarCategoriaResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const categoriasService = {
  listar(activo = true): Promise<CategoriaResponse[]> {
    return apiRequest<CategoriaResponse[]>('/categorias', {
      method: 'GET',
      params: { activo },
    })
  },

  crear(payload: CrearCategoriaRequest): Promise<CategoriaResponse> {
    return apiRequest<CategoriaResponse>('/categorias', {
      method: 'POST',
      body: payload,
    })
  },

  actualizar(
    idCategoria: number,
    payload: ActualizarCategoriaRequest,
  ): Promise<CategoriaResponse> {
    return apiRequest<CategoriaResponse>(`/categorias/${idCategoria}`, {
      method: 'PUT',
      body: payload,
    })
  },

  inactivar(idCategoria: number): Promise<InactivarCategoriaResponse> {
    return apiRequest<InactivarCategoriaResponse>(
      `/categorias/${idCategoria}/inactivar`,
      {
        method: 'PATCH',
      },
    )
  },
}
