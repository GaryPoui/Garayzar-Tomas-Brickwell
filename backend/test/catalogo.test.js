import { test } from 'node:test'
import assert from 'node:assert/strict'
import { send, customer, admin, booking } from './helpers.js'
import { instant, today } from '../src/utils/validation.js'
test('catálogo real, disponibilidad y exclusión protegida', async () => {
  const catalog = await send('/catalogo?fecha=2099-12-20')
  assert.equal(catalog.data.mesas.length, 12)
  assert.equal(catalog.data.sectores.length, 3)
  assert.equal((await send('/catalogo?fecha=2099-02-31')).status, 400)
  const client = await customer()
  const saved = await send('/reservas', 'POST', booking(), client.token)
  assert.equal((await send('/catalogo?fecha=2099-12-20')).data.mesas[0].disponible, false)
  const path = `/catalogo?fecha=2099-12-20&excluir=${saved.data.id}`
  assert.equal((await send(path)).status, 400)
  assert.equal((await send(path, 'GET', undefined, client.token)).status, 400)
  assert.equal((await send(path, 'GET', undefined, admin.token)).data.mesas[0].disponible, true)
  await send(`/reservas/${saved.data.id}`, 'DELETE', undefined, admin.token)
})
test('precios del servidor, capacidad, formatos estrictos, combos y reserva por cliente/fecha', async () => {
  const client = await customer()
  const valid = booking({ fecha: '2099-12-21', combos: [{ id: 2, cantidad: 2 }], precioTotal: 1 })
  const result = await send('/reservas', 'POST', valid, client.token)
  assert.equal(result.status, 201)
  assert.equal(result.data.precioTotal, 156000)
  assert.equal((await send('/reservas', 'POST', { ...valid, mesa: 2 }, client.token)).status, 409)
  const another = await customer()
  assert.equal((await send('/reservas', 'POST', valid, another.token)).status, 409)
  for (const overrides of [
    { mesa: undefined, sector: 999, paquete: 999, precioTotal: 1 },
    { mesa: true },
    { personas: true },
    { anticipo: false },
    { mesa: 9, personas: 3 },
    { combos: [{ id: 2, cantidad: 0 }] },
    { combos: [{ id: 2, cantidad: true }] },
    { combos: [{ id: 999, cantidad: 1 }] },
    {
      combos: [
        { id: 2, cantidad: 1 },
        { id: 2, cantidad: 1 },
      ],
    },
    { combos: 'mal' },
    { horario: '25:00' },
    { fecha: '2020-01-01' },
  ])
    assert.equal(
      (
        await send(
          '/reservas',
          'POST',
          { ...booking({ fecha: '2099-12-22' }), ...overrides },
          client.token,
        )
      ).status,
      400,
      JSON.stringify(overrides),
    )
  assert.equal(
    (
      await send(
        '/reservas',
        'POST',
        booking({ fecha: '2099-12-22', anticipo: 80000 }),
        client.token,
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await send(
        '/reservas',
        'POST',
        booking({ fecha: '2099-12-22', descuento: 100 }),
        client.token,
      )
    ).status,
    403,
  )
  const edit = await send(
    `/reservas/${result.data.id}`,
    'PUT',
    { descuento: 10, anticipo: 1000 },
    admin.token,
  )
  assert.equal(edit.data.precioTotal, 140400)
  assert.equal(edit.data.combos[0].nombre, 'Smirnoff + Speed')
})
test('transiciones, check-in del día, cierre inmutable y límite exacto de cancelación', async (t) => {
  const date1 = new Date(instant(today(), '12:00') + 2 * 86400000).toISOString().slice(0, 10)
  const date2 = new Date(instant(today(), '12:00') + 3 * 86400000).toISOString().slice(0, 10)
  const client = await customer()
  const r = (await send('/reservas', 'POST', booking({ fecha: date1 }), client.token)).data
  const path = `/reservas/${r.id}`
  assert.equal((await send(path, 'PUT', { estado: 'FINALIZADA' }, admin.token)).status, 409)
  assert.equal((await send(path, 'PUT', { estado: 'CONFIRMADA' }, admin.token)).status, 200)
  assert.equal((await send(path, 'PUT', { estado: 'ACTIVA' }, admin.token)).status, 409)
  t.mock.timers.enable({ apis: ['Date'], now: instant(date1, '21:30') })
  assert.equal((await send(path, 'DELETE', undefined, client.token)).status, 200)
  t.mock.timers.reset()
  const next = (await send('/reservas', 'POST', booking({ fecha: date2 }), client.token)).data
  t.mock.timers.enable({ apis: ['Date'], now: instant(date2, '21:31') })
  assert.equal((await send(`/reservas/${next.id}`, 'DELETE', undefined, client.token)).status, 409)
  await send(`/reservas/${next.id}`, 'PUT', { estado: 'CONFIRMADA' }, admin.token)
  assert.equal(
    (await send(`/reservas/${next.id}`, 'PUT', { estado: 'ACTIVA' }, admin.token)).status,
    200,
  )
  assert.equal((await send(`/reservas/${next.id}`, 'PUT', { mesa: 2 }, admin.token)).status, 409)
  assert.equal(
    (await send(`/reservas/${next.id}`, 'PUT', { estado: 'FINALIZADA' }, admin.token)).status,
    200,
  )
  assert.equal(
    (await send(`/reservas/${next.id}`, 'PUT', { estado: 'PENDIENTE' }, admin.token)).status,
    409,
  )
  t.mock.timers.reset()
})
