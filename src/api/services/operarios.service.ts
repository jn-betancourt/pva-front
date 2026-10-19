import type {
  ActualizarOperarioRequest,
  ActualizarPinRequest,
  CrearOperarioRequest,
  OperarioCreadoResponse,
  OperarioDesbloqueadoResponse,
  OperarioInactivadoResponse,
  OperarioPinResponse,
  OperarioResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const operariosService = {
  listar(activo?: boolean): Promise<OperarioResponse[]> {
    return apiRequest<OperarioResponse[]>('/operarios', {
      method: 'GET',
      params: { activo },
    })
  },

  obtenerPorId(idOperario: number): Promise<OperarioResponse> {
    return apiRequest<OperarioResponse>(`/operarios/${idOperario}`, {
      method: 'GET',
    })
  },

  crear(payload: CrearOperarioRequest): Promise<OperarioCreadoResponse> {
    return apiRequest<OperarioCreadoResponse>('/operarios', {
      method: 'POST',
      body: payload,
    })
  },

  actualizar(
    idOperario: number,
    payload: ActualizarOperarioRequest,
  ): Promise<OperarioResponse> {
    return apiRequest<OperarioResponse>(`/operarios/${idOperario}`, {
      method: 'PUT',
      body: payload,
    })
  },

  actualizarPin(
    idOperario: number,
    payload: ActualizarPinRequest,
  ): Promise<OperarioPinResponse> {
    return apiRequest<OperarioPinResponse>(`/operarios/${idOperario}/pin`, {
      method: 'PATCH',
      body: payload,
    })
  },

  desbloquear(idOperario: number): Promise<OperarioDesbloqueadoResponse> {
    return apiRequest<OperarioDesbloqueadoResponse>(
      `/operarios/${idOperario}/desbloquear`,
      {
        method: 'PATCH',
      },
    )
  },

  inactivar(idOperario: number): Promise<OperarioInactivadoResponse> {
    return apiRequest<OperarioInactivadoResponse>(
      `/operarios/${idOperario}/inactivar`,
      {
        method: 'PATCH',
      },
    )
  },
}
