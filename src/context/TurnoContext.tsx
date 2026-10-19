import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { turnosService } from '../api/services/turnos.service'
import type {
  AbrirTurnoRequest,
  CerrarTurnoRequest,
  TurnoActivoResponse,
  TurnoResponse,
} from '../types/api.types'
import { useAuth } from './AuthContext'

interface TurnoContextValue {
  turnoActivo: TurnoActivoResponse | null
  tieneTurnoAbierto: boolean
  cargandoTurno: boolean
  errorTurno: string | null
  refrescarTurnoActivo: () => Promise<void>
  abrirTurno: (payload: AbrirTurnoRequest) => Promise<TurnoResponse>
  cerrarTurno: (
    idTurno: number,
    payload: CerrarTurnoRequest,
  ) => Promise<TurnoResponse>
}

const TurnoContext = createContext<TurnoContextValue | null>(null)

export function TurnoProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [turnoActivo, setTurnoActivo] = useState<TurnoActivoResponse | null>(
    null,
  )
  const [cargandoTurno, setCargandoTurno] = useState(false)
  const [errorTurno, setErrorTurno] = useState<string | null>(null)

  const refrescarTurnoActivo = useCallback(async () => {
    if (!isAuthenticated) {
      setTurnoActivo(null)
      return
    }
    setCargandoTurno(true)
    setErrorTurno(null)
    try {
      const data = await turnosService.obtenerActivo()
      setTurnoActivo(data)
    } catch (err) {
      setErrorTurno(
        err instanceof Error ? err.message : 'Error consultando el turno activo',
      )
    } finally {
      setCargandoTurno(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    queueMicrotask(() => {
      void refrescarTurnoActivo()
    })
  }, [refrescarTurnoActivo])

  const abrirTurno = useCallback(async (payload: AbrirTurnoRequest) => {
    const creado = await turnosService.abrir(payload)
    setTurnoActivo({
      id_turno: creado.id_turno,
      id_operario: creado.id_operario,
      nombre_operario: creado.nombre_operario,
      base_efectivo_inicial: creado.base_efectivo_inicial,
      total_efectivo_ventas: creado.total_efectivo_ventas,
      total_digital_ventas: creado.total_digital_ventas,
      estado: creado.estado,
      fecha_apertura: creado.fecha_apertura,
    })
    return creado
  }, [])

  const cerrarTurno = useCallback(
    async (idTurno: number, payload: CerrarTurnoRequest) => {
      const cerrado = await turnosService.cerrar(idTurno, payload)
      setTurnoActivo({
        id_turno: null,
        estado: null,
        mensaje: 'El operario no tiene un turno abierto',
      })
      return cerrado
    },
    [],
  )

  const tieneTurnoAbierto = Boolean(
    turnoActivo?.id_turno && turnoActivo?.estado === 'ABIERTO',
  )

  const value = useMemo<TurnoContextValue>(
    () => ({
      turnoActivo,
      tieneTurnoAbierto,
      cargandoTurno,
      errorTurno,
      refrescarTurnoActivo,
      abrirTurno,
      cerrarTurno,
    }),
    [
      turnoActivo,
      tieneTurnoAbierto,
      cargandoTurno,
      errorTurno,
      refrescarTurnoActivo,
      abrirTurno,
      cerrarTurno,
    ],
  )

  return <TurnoContext.Provider value={value}>{children}</TurnoContext.Provider>
}

export function useTurno(): TurnoContextValue {
  const ctx = useContext(TurnoContext)
  if (!ctx) {
    throw new Error('useTurno debe utilizarse dentro de TurnoProvider')
  }
  return ctx
}
