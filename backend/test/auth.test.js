import { test } from 'node:test'
import assert from 'node:assert/strict'
import { send, account, customer, admin, reception, booking } from './helpers.js'
test('registro valida edad, fecha real, teléfono, contraseña y email único; no permite elevar rol', async () => {
  for (const overrides of [
    { fechaNacimiento: '2020-01-01' },
    { fechaNacimiento: '2000-02-31' },
    { fechaNacimiento: '2099-01-01' },
    { fechaNacimiento: undefined },
    { telefono: 'abc' },
    { telefono: 123456789 },
    { password: 'aaaaaaaaaa' },
    { nombre: '' },
    { email: 'mal' },
  ])
    assert.equal((await send('/auth/registro', 'POST', account(overrides))).status, 400)
  const values = account()
  const registered = await send('/auth/registro', 'POST', { ...values, rol: 'ADMIN' })
  assert.equal(registered.status, 201)
  assert.equal(registered.data.user.rol, 'CLIENTE')
  assert.equal(registered.data.user.fechaNacimiento, '2000-01-01')
  assert.equal(registered.data.user.hash, undefined)
  assert.equal(
    (await send('/auth/registro', 'POST', { ...values, email: values.email.toUpperCase() })).status,
    409,
  )
  assert.equal(
    (await send('/auth/login', 'POST', { ...values, password: 'incorrecta' })).status,
    401,
  )
  assert.equal(
    (await send('/auth/sesion', 'GET', undefined, registered.data.token)).data.id,
    registered.data.user.id,
  )
  assert.equal((await send('/auth/logout', 'POST', {}, registered.data.token)).status, 200)
  assert.equal((await send('/auth/sesion', 'GET', undefined, registered.data.token)).status, 401)
})
test('reservas privadas, identidad desde sesión, cancelación propia y roles independientes', async () => {
  assert.equal((await send('/reservas')).status, 401)
  const owner = await customer(),
    another = await customer()
  const created = await send(
    '/reservas',
    'POST',
    booking({ cliente: another.user.id }),
    owner.token,
  )
  assert.equal(created.status, 201)
  assert.equal(created.data.cliente, owner.user.id)
  const path = `/reservas/${created.data.id}`
  assert.equal((await send('/reservas', 'GET', undefined, another.token)).data.length, 0)
  assert.equal((await send(path, 'GET', undefined, another.token)).status, 404)
  assert.equal((await send(path, 'DELETE', undefined, another.token)).status, 404)
  assert.equal((await send(path, 'PUT', { estado: 'CONFIRMADA' }, owner.token)).status, 403)
  assert.equal((await send(path, 'DELETE', undefined, reception.token)).status, 403)
  assert.equal(
    (await send(path, 'PUT', { estado: 'CONFIRMADA', cliente: another.user.id }, reception.token))
      .data.cliente,
    owner.user.id,
  )
  assert.equal((await send(path, 'DELETE', undefined, owner.token)).data.estado, 'CANCELADA')
  assert.equal((await send(path, 'GET', undefined, owner.token)).data.estado, 'CANCELADA')
  assert.equal((await send(path, 'DELETE', undefined, owner.token)).status, 409)
  assert.equal((await send('/catalogo?fecha=2099-12-20')).data.mesas[0].disponible, true)
  assert.equal((await send(path, 'PUT', { estado: 'PENDIENTE' }, admin.token)).status, 409)
  assert.equal((await send(path, 'DELETE', undefined, admin.token)).status, 200)
  assert.equal((await send(path, 'GET', undefined, admin.token)).status, 404)
})
test('baja de usuario revoca sesiones y el perfil público no puede elevar permisos', async () => {
  const client = await customer()
  assert.equal(
    (await send('/perfil', 'PUT', { nombre: 'Nombre actualizado', rol: 'ADMIN' }, client.token))
      .data.rol,
    'CLIENTE',
  )
  assert.equal((await send('/gestion/usuarios', 'GET', undefined, reception.token)).status, 403)
  assert.equal((await send('/auth/sesion', 'GET', undefined, client.token)).status, 200)
  assert.equal(
    (await send(`/gestion/usuarios/${client.user.id}`, 'PUT', { activo: false }, admin.token))
      .status,
    200,
  )
  assert.equal((await send('/auth/sesion', 'GET', undefined, client.token)).status, 401)
  assert.equal(
    (await send(`/gestion/usuarios/${admin.user.id}`, 'PUT', { activo: false }, admin.token))
      .status,
    409,
  )
})
test('JSON malformado devuelve 400 y las rutas inexistentes conservan el formato de error', async () => {
  assert.equal((await send('/auth/registro', 'POST', '{"email":', undefined, true)).status, 400)
  const missing = await send('/ruta-inexistente', 'GET', undefined, admin.token)
  assert.equal(missing.status, 404)
  assert.equal(missing.success, false)
  assert.equal(
    (await send(`/reservas/${'9'.repeat(100)}`, 'GET', undefined, admin.token)).status,
    404,
  )
})
