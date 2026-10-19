import { useEffect, useRef } from 'react'

/**
 * US-07: Reconocimiento automático del evento Enter del lector óptico de código de barras.
 * Detecta ráfagas rápidas de caracteres numéricos/alfanuméricos terminadas en Enter
 * cuando el foco no está en un input de texto común.
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  enabled = true,
) {
  const bufferRef = useRef<string>('')
  const lastKeyTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (isInputFocused) return

      const now = Date.now()
      if (now - lastKeyTimeRef.current > 120) {
        bufferRef.current = ''
      }
      lastKeyTimeRef.current = now

      if (event.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        bufferRef.current = ''
        if (scanned.length >= 4) {
          event.preventDefault()
          onScan(scanned)
        }
        return
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        bufferRef.current += event.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onScan, enabled])
}
