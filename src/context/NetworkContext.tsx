import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  checkBackendHealth,
  getActiveApiBaseUrl,
  getApiTargetMode,
  setApiTargetMode,
  type ApiTargetMode,
} from '../api/httpClient'

interface NetworkContextValue {
  isOnline: boolean
  lastChangedAt: string | null
  apiTargetMode: ApiTargetMode
  activeBaseUrl: string
  backendReachable: boolean | null
  backendStatusText: string
  latencyMs: number | null
  checkingHealth: boolean
  cambiarServidorApi: (mode: ApiTargetMode) => void
  verificarSaludServidor: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null)
  const [apiTargetMode, setApiTargetModeState] = useState<ApiTargetMode>(() =>
    getApiTargetMode(),
  )
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null)
  const [backendStatusText, setBackendStatusText] = useState<string>('Verificando...')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false)

  const verificarSaludServidor = useCallback(
    async (modeOverride?: ApiTargetMode) => {
      const targetMode = modeOverride ?? apiTargetMode
      setCheckingHealth(true)
      try {
        const res = await checkBackendHealth(targetMode)
        setBackendReachable(res.ok)
        setBackendStatusText(res.status)
        setLatencyMs(res.latencyMs)
      } finally {
        setCheckingHealth(false)
      }
    },
    [apiTargetMode],
  )

  const cambiarServidorApi = useCallback(
    (mode: ApiTargetMode) => {
      setApiTargetMode(mode)
      setApiTargetModeState(mode)
      void verificarSaludServidor(mode)
    },
    [verificarSaludServidor],
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChangedAt(new Date().toISOString())
      void verificarSaludServidor()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setBackendReachable(false)
      setBackendStatusText('SIN RED')
      setLastChangedAt(new Date().toISOString())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [verificarSaludServidor])

  useEffect(() => {
    queueMicrotask(() => {
      void verificarSaludServidor()
    })
  }, [verificarSaludServidor])

  const activeBaseUrl = getActiveApiBaseUrl(apiTargetMode)

  const value = useMemo<NetworkContextValue>(
    () => ({
      isOnline,
      lastChangedAt,
      apiTargetMode,
      activeBaseUrl,
      backendReachable,
      backendStatusText,
      latencyMs,
      checkingHealth,
      cambiarServidorApi,
      verificarSaludServidor: () => verificarSaludServidor(),
    }),
    [
      isOnline,
      lastChangedAt,
      apiTargetMode,
      activeBaseUrl,
      backendReachable,
      backendStatusText,
      latencyMs,
      checkingHealth,
      cambiarServidorApi,
      verificarSaludServidor,
    ],
  )

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext)
  if (!ctx) {
    throw new Error('useNetwork debe utilizarse dentro de NetworkProvider')
  }
  return ctx
}
