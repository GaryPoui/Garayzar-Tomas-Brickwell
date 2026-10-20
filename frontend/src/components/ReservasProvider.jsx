import { useEffect, useEffectEvent, useState } from 'react'
import { obtenerReservas } from '../services/reservaService.js'
import { ReservasContext, useNotification } from '../utils/applicationContext.js'

export function ReservasProvider({ children }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const notify = useNotification()
  const reportError = useEffectEvent((message) => notify(message, 'error'))

  useEffect(() => {
    const controller = new AbortController()
    obtenerReservas({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(data))
          throw new Error('El servidor no devolvió un listado de reservas válido.')
        setReservas(data)
        setError('')
      })
      .catch((failure) => {
        if (controller.signal.aborted) return
        setError(failure.message)
        reportError(failure.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])

  function refresh() {
    setLoading(true)
    setError('')
    setRevision((current) => current + 1)
  }

  return (
    <ReservasContext.Provider value={{ reservas, loading, error, refresh }}>
      {children}
    </ReservasContext.Provider>
  )
}
