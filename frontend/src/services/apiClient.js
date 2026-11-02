const API_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')
const REQUEST_TIMEOUT = import.meta.env?.PROD ? 90000 : 15000

export async function requestApi(path, { signal, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT)])
        : AbortSignal.timeout(REQUEST_TIMEOUT),
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor. Intentá nuevamente.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'El servidor devolvió una respuesta incorrecta.')
    error.status = response.status
    throw error
  }
  return result.data
}
