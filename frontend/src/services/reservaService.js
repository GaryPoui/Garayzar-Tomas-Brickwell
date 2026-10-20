const API_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path = '', { signal, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}/reservas${path}`, {
      ...options,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor. Intentá nuevamente.')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'El servidor devolvió una respuesta incorrecta.')
  }
  return result.data
}

export const obtenerReservas = (options) => request('', options)
export const obtenerReserva = (id, options) => request(`/${encodeURIComponent(id)}`, options)
export const crearReserva = (datos) => request('', { method: 'POST', body: JSON.stringify(datos) })
export const modificarReserva = (id, datos) =>
  request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
export const eliminarReserva = (id) => request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
