import { useEffect, useState } from 'react'
import { Activity, AlertCircle, LoaderCircle } from 'lucide-react'
import { getBackendHealth } from '../../api/api'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    const checkHealth = async () => {
      try {
        const health = await getBackendHealth()
        if (active) {
          setStatus(
            health?.status === 'ok' && health?.database === 'connected'
              ? 'online'
              : 'offline'
          )
        }
      } catch {
        if (active) setStatus('offline')
      }
    }

    checkHealth()
    const intervalId = setInterval(checkHealth, 30000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [])

  const config = {
    checking: {
      label: 'CHECKING BACKEND',
      color: 'var(--depot-muted)',
      Icon: LoaderCircle,
      className: 'animate-spin',
    },
    online: {
      label: 'BACKEND ONLINE',
      color: 'var(--depot-green)',
      Icon: Activity,
      className: '',
    },
    offline: {
      label: 'BACKEND OFFLINE',
      color: '#ff1744',
      Icon: AlertCircle,
      className: '',
    },
  }

  const current = config[status]
  const Icon = current.Icon

  return (
    <div
      className="flex items-center gap-2 text-xs font-mono whitespace-nowrap"
      role="status"
      aria-live="polite"
      title={
        status === 'online'
          ? 'Backend and database are responding'
          : status === 'offline'
            ? 'Backend or database is unavailable'
            : 'Checking backend connection'
      }
    >
      <Icon size={13} className={current.className} style={{ color: current.color }} />
      <span style={{ color: current.color }}>{current.label}</span>
    </div>
  )
}
