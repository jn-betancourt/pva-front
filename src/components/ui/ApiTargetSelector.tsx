import { Cloud, GlobeLock, Laptop, RefreshCw } from 'lucide-react'
import { AZURE_HOST_URL, type ApiTargetMode } from '../../api/httpClient'
import { useNetwork } from '../../context/NetworkContext'

interface ApiTargetSelectorProps {
  compact?: boolean
}

export function ApiTargetSelector({ compact = false }: ApiTargetSelectorProps) {
  const {
    apiTargetMode,
    activeBaseUrl,
    backendReachable,
    backendStatusText,
    latencyMs,
    checkingHealth,
    cambiarServidorApi,
    verificarSaludServidor,
  } = useNetwork()

  const handleSelectChange = (mode: ApiTargetMode) => {
    cambiarServidorApi(mode)
  }

  if (compact) {
    return (
      <div className="api-target-compact" title={`URL Base Activa: ${activeBaseUrl}`}>
        <Cloud size={15} />
        <select
          aria-label="Seleccionar servidor de API"
          className="api-target-select-compact"
          value={apiTargetMode}
          onChange={(e) => handleSelectChange(e.target.value as ApiTargetMode)}
        >
          <option value="azure">
            ☁️ Azure Cloud (pva-awd3d3bmcrbre3et.westus3-01)
          </option>
          <option value="azure-proxy">
            🛡️ Azure vía Proxy Vite (/api/v1)
          </option>
          <option value="local">💻 Localhost (:8080)</option>
        </select>
        <button
          type="button"
          className="api-ping-btn"
          onClick={() => void verificarSaludServidor()}
          disabled={checkingHealth}
          title={`Estado: ${backendStatusText} (${latencyMs ?? '—'} ms) — Clic para verificar /actuator/health`}
        >
          <span
            className={`health-dot ${
              checkingHealth
                ? 'dot-checking'
                : backendReachable
                  ? 'dot-up'
                  : 'dot-down'
            }`}
          />
          <span>
            {checkingHealth
              ? 'Ping...'
              : backendReachable
                ? `${latencyMs}ms`
                : 'Verificar'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="api-target-box">
      <div className="api-target-header">
        <div>
          <strong>Servidor Backend Spring Boot Conectado</strong>
          <div className="api-target-url">{activeBaseUrl}</div>
        </div>
        <button
          type="button"
          className="touch-target btn btn-secondary btn-sm"
          onClick={() => void verificarSaludServidor()}
          disabled={checkingHealth}
          title={`Probar salud en ${AZURE_HOST_URL}/actuator/health`}
        >
          <RefreshCw size={14} />
          <span>
            {checkingHealth
              ? 'Probando...'
              : backendReachable
                ? `UP (${latencyMs} ms)`
                : backendStatusText}
          </span>
        </button>
      </div>

      <div className="api-target-pills">
        <button
          type="button"
          className={`touch-target api-mode-btn ${
            apiTargetMode === 'azure' ? 'active' : ''
          }`}
          onClick={() => handleSelectChange('azure')}
        >
          <Cloud size={16} />
          <div>
            <strong>Azure Directo</strong>
            <span>westus3-01.azurewebsites.net</span>
          </div>
        </button>

        <button
          type="button"
          className={`touch-target api-mode-btn ${
            apiTargetMode === 'azure-proxy' ? 'active' : ''
          }`}
          onClick={() => handleSelectChange('azure-proxy')}
        >
          <GlobeLock size={16} />
          <div>
            <strong>Azure Proxy</strong>
            <span>Sin CORS (/api/v1 → Azure)</span>
          </div>
        </button>

        <button
          type="button"
          className={`touch-target api-mode-btn ${
            apiTargetMode === 'local' ? 'active' : ''
          }`}
          onClick={() => handleSelectChange('local')}
        >
          <Laptop size={16} />
          <div>
            <strong>Servidor Local</strong>
            <span>localhost:8080/api/v1</span>
          </div>
        </button>
      </div>
    </div>
  )
}
