import { requestApi } from './apiClient.js'
export const obtenerRecurso = (path, options) => requestApi(path, options)
export const crearRecurso = (path, data = {}) =>
  requestApi(path, { method: 'POST', body: JSON.stringify(data) })
export const guardarRecurso = (path, data) =>
  requestApi(path, { method: 'PUT', body: JSON.stringify(data) })
export const borrarRecurso = (path) => requestApi(path, { method: 'DELETE' })
export const obtenerCarta = (options) => obtenerRecurso('/carta', options)
