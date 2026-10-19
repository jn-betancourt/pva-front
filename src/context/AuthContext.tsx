import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SESSION_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../api/httpClient'
import { authService } from '../api/services/auth.service'
import type {
  LoginRequest,
  LoginResponse,
  RolOperario,
} from '../types/api.types'

export interface SessionUser {
  id_operario: number
  nombre_completo: string
  nombre_usuario: string
  rol: RolOperario
}

interface AuthContextValue {
  user: SessionUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (payload: LoginRequest) => Promise<LoginResponse>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [user, setUser] = useState<SessionUser | null>(() => readInitialUser())

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
    }
    window.addEventListener('pva:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('pva:unauthorized', handleUnauthorized)
    }
  }, [clearSession])

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload)
    const sessionUser: SessionUser = {
      id_operario: response.id_operario,
      nombre_completo: response.nombre_completo,
      nombre_usuario: response.nombre_usuario,
      rol: response.rol,
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
    setToken(response.token)
    setUser(sessionUser)
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Aun si falla la red o el token expiró, limpiamos sesión local
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.rol === 'ADMIN',
      login,
      logout,
    }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }
  return ctx
}
