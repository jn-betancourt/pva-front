import type { ApiErrorResponse } from '../types/api.types'

export const AZURE_HOST_URL =
  'https://pva-awd3d3bmcrbre3et.westus3-01.azurewebsites.net'

export const AZURE_API_BASE_URL =
  import.meta.env.VITE_AZURE_API_URL || `${AZURE_HOST_URL}/api/v1`

export const LOCAL_API_BASE_URL =
  import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8080/api/v1'

export const AZURE_PROXY_BASE_URL = '/api/v1'

export type ApiTargetMode = 'azure' | 'azure-proxy' | 'local'

export const TOKEN_STORAGE_KEY = 'pva_auth_token'
export const SESSION_STORAGE_KEY = 'pva_session_user'
export const API_TARGET_STORAGE_KEY = 'pva_api_target_mode'

const REQUEST_TIMEOUT_MS = 25000

export function getApiTargetMode(): ApiTargetMode {
  const saved = localStorage.getItem(API_TARGET_STORAGE_KEY)
  if (saved === 'azure' || saved === 'azure-proxy' || saved === 'local') {
    return saved
  }
  return 'azure'
}

export function setApiTargetMode(mode: ApiTargetMode): void {
  localStorage.setItem(API_TARGET_STORAGE_KEY, mode)
  window.dispatchEvent(new CustomEvent('pva:api-target-changed', { detail: mode }))
}

export function getActiveApiBaseUrl(mode: ApiTargetMode = getApiTargetMode()): string {
  switch (mode) {
    case 'azure':
      return AZURE_API_BASE_URL
    case 'azure-proxy':
      return AZURE_PROXY_BASE_URL
    case 'local':
      return LOCAL_API_BASE_URL
  }
}

export function getActiveHealthUrl(mode: ApiTargetMode = getApiTargetMode()): string {
  switch (mode) {
    case 'azure':
      return `${AZURE_HOST_URL}/actuator/health`
    case 'azure-proxy':
      return '/actuator/health'
    case 'local':
      return 'http://localhost:8080/actuator/health'
  }
}

export class PvaApiError extends Error {
  status: number
  codigo: string
  detalle: string | null

  constructor(
    status: number,
    error: string,
    codigo = 'ERR-DESCONOCIDO',
    detalle: string | null = null,
  ) {
    super(error)
    this.name = 'PvaApiError'
    this.status = status
    this.codigo = codigo
    this.detalle = detalle
  }
}

type QueryParams = Record<string, string | number | boolean | undefined | null>

function buildUrl(endpoint: string, params?: QueryParams): string {
  const baseUrl = getActiveApiBaseUrl().replace(/\/+$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const fullPath = `${baseUrl}${cleanEndpoint}`

  const url = fullPath.startsWith('http')
    ? new URL(fullPath)
    : new URL(fullPath, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }
  return url.toString()
}

export async function checkBackendHealth(
  mode: ApiTargetMode = getApiTargetMode(),
): Promise<{ ok: boolean; status: string; latencyMs: number; url: string }> {
  const healthUrl = getActiveHealthUrl(mode)
  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)

  try {
    const resp = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    })
    const latencyMs = Math.round(performance.now() - start)
    if (!resp.ok) {
      return { ok: false, status: `HTTP ${resp.status}`, latencyMs, url: healthUrl }
    }
    const data = (await resp.json().catch(() => ({ status: 'UP' }))) as {
      status?: string
    }
    return {
      ok: true,
      status: data.status || 'UP',
      latencyMs,
      url: healthUrl,
    }
  } catch {
    const latencyMs = Math.round(performance.now() - start)
    return { ok: false, status: 'OFFLINE / CORS', latencyMs, url: healthUrl }
  } finally {
    clearTimeout(timer)
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: QueryParams
  body?: unknown
  skipAuth?: boolean
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, skipAuth = false, headers: customHeaders, ...rest } = options
  const url = buildUrl(endpoint, params)
  const currentMode = getApiTargetMode()

  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const isTimeout = err instanceof DOMException && err.name === 'AbortError'
    const targetLabel =
      currentMode === 'local'
        ? 'Servidor Local (localhost:8080)'
        : 'Azure App Service (pva-awd3d3bmcrbre3et.westus3-01.azurewebsites.net)'
    throw new PvaApiError(
      0,
      isTimeout
        ? `Tiempo de espera agotado conectando con ${targetLabel} (posible Cold Start en Azure)`
        : `No se pudo conectar con ${targetLabel}`,
      isTimeout ? 'RED-TIMEOUT-AZURE' : 'RED-SIN-CONEXION',
      currentMode === 'azure'
        ? 'Si desarrolla localmente desde otro puerto y observa bloqueo CORS, cambie el selector superior a "Azure Proxy (/api/v1)" o intente nuevamente mientras despierta el servicio en Azure.'
        : 'Verifique que el servidor destino esté en ejecución o cambie el entorno en el selector superior.',
    )
  } finally {
    clearTimeout(timeoutId)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!response.ok) {
    if (isJson) {
      const errBody = (await response.json()) as Partial<ApiErrorResponse>
      if (
        response.status === 401 &&
        errBody.codigo === 'AUTH-TOKEN-INVALIDO' &&
        !skipAuth
      ) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(SESSION_STORAGE_KEY)
        window.dispatchEvent(new CustomEvent('pva:unauthorized'))
      }
      throw new PvaApiError(
        response.status,
        errBody.error || `Error HTTP ${response.status}`,
        errBody.codigo || `HTTP-${response.status}`,
        errBody.detalle ?? null,
      )
    }
    throw new PvaApiError(
      response.status,
      `Error del servidor (${response.status})`,
      `HTTP-${response.status}`,
      null,
    )
  }

  if (isJson) {
    return (await response.json()) as T
  }
  return (await response.text()) as unknown as T
}
