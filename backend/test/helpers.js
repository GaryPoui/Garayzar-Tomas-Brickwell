import { after } from 'node:test'
import { randomUUID } from 'node:crypto'
process.env.DATABASE_PATH = ':memory:'
process.env.ADMIN_EMAIL = 'admin-test@example.com'
process.env.ADMIN_PASSWORD = 'Admin-test-password-123'
process.env.RECEPCION_EMAIL = 'recepcion-test@example.com'
process.env.RECEPCION_PASSWORD = 'Recepcion-test-password-123'
const { default: app } = await import('../src/app.js')
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))
after(() => new Promise((resolve) => server.close(resolve)))
const base = `http://127.0.0.1:${server.address().port}/api`
export async function send(path, method = 'GET', body, token, raw = false) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  })
  return { status: response.status, ...(await response.json()) }
}
export const account = (overrides = {}) => ({
  nombre: 'Cliente de prueba',
  email: `${randomUUID()}@example.com`,
  password: 'Una-clave-segura-123',
  fechaNacimiento: '2000-01-01',
  telefono: '2262551234',
  ...overrides,
})
export const customer = async (overrides) =>
  (await send('/auth/registro', 'POST', account(overrides))).data
export const admin = (
  await send('/auth/login', 'POST', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
).data
export const reception = (
  await send('/auth/login', 'POST', {
    email: process.env.RECEPCION_EMAIL,
    password: process.env.RECEPCION_PASSWORD,
  })
).data
export const booking = (overrides = {}) => ({
  fecha: '2099-12-20',
  horario: '23:30',
  mesa: 1,
  personas: 2,
  combos: [],
  ...overrides,
})
