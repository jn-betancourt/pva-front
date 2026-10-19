import { Delete, KeyRound } from 'lucide-react'

interface TouchPinPadProps {
  pin: string
  onChange: (nextPin: string) => void
  onSubmit?: () => void
  disabled?: boolean
  maxLength?: number
  minLength?: number
  submitLabel?: string
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function TouchPinPad({
  pin,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = 6,
  minLength = 4,
  submitLabel = 'Ingresar a Caja',
}: TouchPinPadProps) {
  const handleDigit = (digit: string) => {
    if (disabled || pin.length >= maxLength) return
    onChange(pin + digit)
  }

  const handleBackspace = () => {
    if (disabled || pin.length === 0) return
    onChange(pin.slice(0, -1))
  }

  const handleClear = () => {
    if (disabled) return
    onChange('')
  }

  const canSubmit = pin.length >= minLength && pin.length <= maxLength && !disabled

  return (
    <div className="pinpad-wrapper" aria-label="Teclado numérico táctil de seguridad">
      <div className="pinpad-display" aria-live="polite">
        <div className="pinpad-dots">
          {Array.from({ length: maxLength }).map((_, idx) => {
            const filled = idx < pin.length
            return (
              <span
                key={idx}
                className={`pinpad-dot ${filled ? 'filled' : ''}`}
                aria-hidden="true"
              />
            )
          })}
        </div>
        <span className="pinpad-hint">
          <KeyRound size={14} /> PIN de {minLength} a {maxLength} dígitos ({pin.length}/{maxLength})
        </span>
      </div>

      <div className="pinpad-grid">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            className="touch-target pinpad-key"
            onClick={() => handleDigit(digit)}
            disabled={disabled || pin.length >= maxLength}
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          className="touch-target pinpad-key pinpad-key-secondary"
          onClick={handleClear}
          disabled={disabled || pin.length === 0}
          title="Limpiar PIN"
        >
          Limpiar
        </button>

        <button
          type="button"
          className="touch-target pinpad-key"
          onClick={() => handleDigit('0')}
          disabled={disabled || pin.length >= maxLength}
        >
          0
        </button>

        <button
          type="button"
          className="touch-target pinpad-key pinpad-key-secondary"
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          title="Borrar último dígito"
          aria-label="Borrar último dígito"
        >
          <Delete size={22} />
        </button>
      </div>

      {onSubmit && (
        <button
          type="button"
          className="touch-target btn btn-primary btn-block pinpad-submit"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {submitLabel}
        </button>
      )}
    </div>
  )
}
