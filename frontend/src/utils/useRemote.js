import { useCallback, useEffect, useState } from 'react'
import { obtenerRecurso } from '../services/negocioService.js'
export default function useRemote(path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    obtenerRecurso(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ path, revision, data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ path, revision, data: null, error: error.message })
      })
    return () => controller.abort()
  }, [path, revision])
  const loading = Boolean(path) && (!result || result.path !== path || result.revision !== revision)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  return {
    data: loading || !path ? null : result.data,
    error: loading || !path ? '' : result.error,
    loading,
    refresh,
  }
}
