import { useEffect, useEffectEvent, useState } from 'react'
import { obtenerCatalogo } from '../services/catalogoService.js'
import { useNotification } from './applicationContext.js'

export default function useCatalogo(fecha, excluir) {
  const [result, setResult] = useState(null)
  const [version, setVersion] = useState(0)
  const notify = useNotification()
  const reportError = useEffectEvent((message) => notify(message, 'error'))
  useEffect(() => {
    const controller = new AbortController()
    obtenerCatalogo({ fecha, excluir, signal: controller.signal })
      .then((catalogo) => {
        if (!controller.signal.aborted) setResult({ catalogo, error: '', fecha, excluir, version })
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setResult({ catalogo: null, error: failure.message, fecha, excluir, version })
          reportError(failure.message)
        }
      })
    return () => controller.abort()
  }, [fecha, excluir, version])
  const loading =
    !result || result.fecha !== fecha || result.excluir !== excluir || result.version !== version
  return {
    catalogo: loading ? null : result.catalogo,
    error: loading ? '' : result.error,
    loading,
    refresh: () => setVersion((current) => current + 1),
  }
}
