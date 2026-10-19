import type { LoginRequest, LoginResponse } from '../../types/api.types'
import { apiRequest } from '../httpClient'

export const authService = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    })
  },

  logout(): Promise<void> {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
    })
  },
}
