import { Banknote } from 'lucide-react'
import { formatCOP } from '../../utils/formatters'

interface BillQuickSelectorProps {
  totalAPagar: number
  montoActual: number
  onSelectAmount: (amount: number) => void
}

const BILLETES_COMUNES = [2000, 5000, 10000, 20000, 50000, 100000]

export function BillQuickSelector({
  totalAPagar,
  montoActual,
  onSelectAmount,
}: BillQuickSelectorProps) {
  return (
    <div className="bill-selector">
      <div className="bill-selector-label">
        <Banknote size={16} />
        <span>Billetes rápidos (Toque para fijar o sumar):</span>
      </div>
      <div className="bill-selector-grid">
        <button
          type="button"
          className={`touch-target bill-chip ${montoActual === totalAPagar ? 'active' : ''}`}
          onClick={() => onSelectAmount(totalAPagar)}
        >
          Exacto ({formatCOP(totalAPagar)})
        </button>
        {BILLETES_COMUNES.map((billete) => (
          <button
            key={billete}
            type="button"
            className={`touch-target bill-chip ${montoActual === billete ? 'active' : ''}`}
            onClick={() => onSelectAmount(billete)}
          >
            {formatCOP(billete)}
          </button>
        ))}
        <button
          type="button"
          className="touch-target bill-chip bill-chip-add"
          onClick={() => onSelectAmount(montoActual + 10000)}
          title="Sumar $10.000 al monto recibido"
        >
          + $10.000
        </button>
      </div>
    </div>
  )
}
