import { requestApi } from './apiClient.js'

const request = (path = '', options) => requestApi(`/reservas${path}`, options)

export const obtenerReservas = (options) => request('', options)
export const obtenerReserva = (id, options) => request(`/${encodeURIComponent(id)}`, options)
export const crearReserva = (datos) => request('', { method: 'POST', body: JSON.stringify(datos) })
export const modificarReserva = (id, datos) =>
  request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
export const eliminarReserva = (id) => request(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
