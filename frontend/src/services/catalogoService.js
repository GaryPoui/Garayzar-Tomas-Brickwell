import { requestApi } from './apiClient.js'

export function obtenerCatalogo({ fecha, excluir, signal } = {}) {
  const params = new URLSearchParams()
  if (fecha) params.set('fecha', fecha)
  if (excluir) params.set('excluir', excluir)
  return requestApi(`/catalogo${params.size ? `?${params}` : ''}`, { signal })
}
