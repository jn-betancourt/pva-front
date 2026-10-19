import type {
  AbrirTurnoRequest,
  CerrarTurnoRequest,
  TurnoActivoResponse,
  TurnoResponse,
} from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const turnosService = {
  obtenerActivo(): Promise<TurnoActivoResponse> {
    return apiRequest<TurnoActivoResponse>('/turnos/activo', {
      method: 'GET',
    })
  },

  abrir(payload: AbrirTurnoRequest): Promise<TurnoResponse> {
    return apiRequest<TurnoResponse>('/turnos/abrir', {
      method: 'POST',
      body: payload,
    })
  },

  cerrar(idTurno: number, payload: CerrarTurnoRequest): Promise<TurnoResponse> {
    return apiRequest<TurnoResponse>(`/turnos/${idTurno}/cerrar`, {
      method: 'POST',
      body: payload,
    })
  },

  obtenerPorId(idTurno: number): Promise<TurnoResponse> {
    return apiRequest<TurnoResponse>(`/turnos/${idTurno}`, {
      method: 'GET',
    })
  },
}
