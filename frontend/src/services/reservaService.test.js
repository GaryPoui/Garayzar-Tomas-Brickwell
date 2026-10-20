import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  obtenerReservas,
  obtenerReserva,
  crearReserva,
  modificarReserva,
  eliminarReserva,
} from './reservaService.js'

afterEach(() => mock.restoreAll())

test('procesa data y centraliza las cinco operaciones HTTP', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ success: true, data: { id: 7 } }),
  }))
  assert.deepEqual(await obtenerReservas(), { id: 7 })
  await obtenerReserva(7)
  await crearReserva({ cliente: 2 })
  await modificarReserva(7, { estado: 'CONFIRMADA' })
  await eliminarReserva(7)
  const calls = fetchMock.mock.calls.map(({ arguments: args }) => [
    args[0],
    args[1].method || 'GET',
  ])
  assert.deepEqual(calls, [
    ['/api/reservas', 'GET'],
    ['/api/reservas/7', 'GET'],
    ['/api/reservas', 'POST'],
    ['/api/reservas/7', 'PUT'],
    ['/api/reservas/7', 'DELETE'],
  ])
  assert.equal(fetchMock.mock.calls[2].arguments[1].body, '{"cliente":2}')
})

test('conserva los mensajes de error de la API', async () => {
  mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    json: async () => ({ success: false, message: 'La reserva no existe.' }),
  }))
  await assert.rejects(obtenerReserva(90), /La reserva no existe/)
})

test('detecta respuestas que no son JSON y fallos de conexión', async () => {
  mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError()
    },
  }))
  await assert.rejects(obtenerReservas(), /respuesta incorrecta/)
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(obtenerReservas(), /conectar con el servidor/)
})

test('no transforma la cancelación de una consulta en un error de conexión', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Aborted', 'AbortError')
  })
  await assert.rejects(obtenerReservas(), { name: 'AbortError' })
})

test('combina cancelación y tiempo de espera sin perder la señal del componente', async () => {
  const controller = new AbortController()
  const fetchMock = mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ success: true, data: [] }),
  }))
  await obtenerReservas({ signal: controller.signal })
  const signal = fetchMock.mock.calls[0].arguments[1].signal
  assert.notEqual(signal, controller.signal)
  controller.abort()
  assert.equal(signal.aborted, true)
})
