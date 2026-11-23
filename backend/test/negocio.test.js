import { test } from 'node:test'
import assert from 'node:assert/strict'
import { send, customer, admin, reception, booking } from './helpers.js'
import { instant, today } from '../src/utils/validation.js'

const event = (overrides) => ({
  nombre: 'Noche de prueba',
  fecha: '2099-12-20',
  horario: '23:30',
  descripcion: 'Música y encuentros',
  precioEntrada: 10000,
  precioPuerta: 15000,
  capacidadMaxima: 1,
  ...overrides,
})
test('evento desde borrador hasta publicación, permisos, cupo concurrente, pago y cancelación', async () => {
  const first = await customer(),
    second = await customer()
  assert.equal((await send('/gestion/eventos', 'POST', event(), reception.token)).status, 403)
  assert.equal(
    (await send('/gestion/eventos', 'POST', event({ descripcion: '' }), admin.token)).status,
    400,
  )
  const created = await send('/gestion/eventos', 'POST', event(), admin.token)
  assert.equal(created.status, 201)
  const id = created.data.id,
    path = `/gestion/eventos/${id}`
  assert.equal((await send(`/eventos/${id}`)).status, 404)
  assert.equal((await send(path, 'PUT', { estado: 'PUBLICADO' }, admin.token)).status, 200)
  assert.equal((await send(`/eventos/${id}`)).status, 200)
  const requests = await Promise.all(
    [first, second].map((client) => send(`/eventos/${id}/entradas`, 'POST', {}, client.token)),
  )
  assert.deepEqual(requests.map((result) => result.status).sort(), [201, 409])
  const issued = requests.find((result) => result.status === 201).data
  assert.equal(issued.precio, 10000)
  assert.equal(issued.estado, 'PENDIENTE_PAGO')
  assert.equal((await send(`/eventos/${id}`)).data.entradasDisponibles, 0)
  assert.equal((await send(path, 'PUT', { capacidadMaxima: 0 }, admin.token)).status, 400)
  assert.equal((await send(path, 'PUT', { estado: 'BORRADOR' }, admin.token)).status, 409)
  const owner = issued.cliente === first.user.id ? first : second
  const other = owner === first ? second : first
  assert.equal(
    (await send(`/entradas/${issued.id}`, 'PUT', { estado: 'CONFIRMADA' }, owner.token)).status,
    403,
  )
  assert.equal((await send('/entradas', 'GET', undefined, other.token)).data.length, 0)
  assert.equal(
    (await send(`/entradas/${issued.id}`, 'PUT', { estado: 'CONFIRMADA' }, reception.token)).status,
    200,
  )
  assert.equal(
    (await send('/gestion/reportes', 'GET', undefined, admin.token)).data.ventasEntradas,
    10000,
  )
  assert.equal(
    (await send(`/entradas/${issued.id}`, 'PUT', { estado: 'USADA' }, reception.token)).status,
    409,
  )
  assert.equal(
    (await send(`/entradas/${issued.id}`, 'PUT', { estado: 'CANCELADA' }, owner.token)).status,
    200,
  )
  assert.equal((await send(`/eventos/${id}`)).data.entradasDisponibles, 1)
  const otherTicket = await send(`/eventos/${id}/entradas`, 'POST', {}, other.token)
  assert.equal(otherTicket.status, 201)
  assert.equal((await send(path, 'PUT', { estado: 'CANCELADO' }, admin.token)).status, 200)
  assert.equal((await send('/entradas', 'GET', undefined, other.token)).data[0].estado, 'CANCELADA')
  assert.equal((await send(`/eventos/${id}`)).status, 404)
  assert.equal((await send(path, 'PUT', { estado: 'PUBLICADO' }, admin.token)).status, 409)
  assert.equal((await send(path, 'DELETE', undefined, admin.token)).status, 409)
})

test('carta desde API, edición de precios y disponibilidad restringidas, sectores y paquetes reales', async () => {
  const carta = await send('/carta')
  assert.equal(carta.data.length, 14)
  const drink = carta.data.find((item) => item.name === 'Mojito')
  const path = `/gestion/catalogo/carta/${drink.id}`
  assert.equal((await send(path, 'PUT', { price: 1 }, reception.token)).status, 403)
  assert.equal((await send(path, 'PUT', { disponible: false }, reception.token)).status, 200)
  assert.ok(!(await send('/carta')).data.some((item) => item.id === drink.id))
  assert.equal(
    (await send(path, 'PUT', { disponible: true, price: 8500 }, admin.token)).status,
    200,
  )
  assert.equal((await send('/carta')).data.find((item) => item.id === drink.id).price, 8500)
  assert.equal(
    (await send('/gestion/catalogo/paquetes/2', 'PUT', { precio: 39000 }, admin.token)).status,
    200,
  )
  assert.equal((await send('/carta')).data.find((item) => item.id === 'combo-2').price, 39000)
  const sector = await send(
    '/gestion/catalogo/sectores',
    'POST',
    {
      nombre: 'Terraza',
      tipo: 'Mesa terraza',
      cercania: 'Exterior',
      descripcion: 'Mesas del exterior',
      precio: 20000,
      personasPorMesa: 3,
      disponible: true,
    },
    admin.token,
  )
  assert.equal(sector.status, 201)
  assert.equal(
    (await send('/catalogo')).data.mesas.filter((item) => item.sector === sector.data.id).length,
    4,
  )
  assert.equal(
    (await send(`/gestion/catalogo/sectores/${sector.data.id}`, 'DELETE', undefined, admin.token))
      .status,
    200,
  )
})

test('avisos privados, historial y precios de reservas conservados al cambiar el catálogo', async () => {
  const client = await customer()
  const saved = await send(
    '/reservas',
    'POST',
    booking({ fecha: '2099-12-28', combos: [{ id: 2, cantidad: 1 }] }),
    client.token,
  )
  assert.equal(saved.status, 201)
  const price = saved.data.precioTotal
  await send('/gestion/catalogo/paquetes/2', 'PUT', { precio: 40000 }, admin.token)
  const edit = await send(
    `/reservas/${saved.data.id}`,
    'PUT',
    { estado: 'CONFIRMADA', combos: [{ id: 2, cantidad: 1 }] },
    admin.token,
  )
  assert.equal(edit.data.precioTotal, price)
  assert.equal(edit.data.combos[0].nombre, 'Smirnoff + Speed')
  assert.equal(
    (await send('/gestion/catalogo/paquetes/2', 'PUT', { activo: false }, admin.token)).status,
    409,
  )
  const avisos = await send('/avisos', 'GET', undefined, client.token)
  assert.ok(avisos.data.some((item) => item.mensaje.includes('confirmada')))
  const another = await customer()
  assert.equal((await send(`/avisos/${avisos.data[0].id}`, 'PUT', {}, another.token)).status, 404)
  assert.equal(
    (await send(`/avisos/${avisos.data[0].id}`, 'PUT', {}, client.token)).data.leida,
    true,
  )
  assert.equal(
    (await send('/historial', 'GET', undefined, client.token)).data.reservas[0].id,
    saved.data.id,
  )
})

test('política configurable, recordatorio único e ingreso al evento del día', async (t) => {
  const config = await send('/configuracion')
  assert.equal(config.data.cancelacionHoras, 2)
  assert.equal(
    (
      await send(
        '/gestion/configuracion',
        'PUT',
        { cancelacionHoras: 6, reembolsos: 'Coordinar con administración.' },
        reception.token,
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await send(
        '/gestion/configuracion',
        'PUT',
        { cancelacionHoras: 1, reembolsos: 'Coordinar con administración.' },
        admin.token,
      )
    ).status,
    400,
  )
  const fecha = new Date(instant(today(), '12:00') + 86400000).toISOString().slice(0, 10)
  const client = await customer()
  const reserva = await send('/reservas', 'POST', booking({ fecha, mesa: 3 }), client.token)
  const created = await send(
    '/gestion/eventos',
    'POST',
    event({ nombre: 'Recordatorio de prueba', fecha, precioEntrada: 0 }),
    admin.token,
  )
  await send(`/gestion/eventos/${created.data.id}`, 'PUT', { estado: 'PUBLICADO' }, admin.token)
  const entrada = await send(`/eventos/${created.data.id}/entradas`, 'POST', {}, client.token)
  assert.equal(entrada.data.estado, 'CONFIRMADA')
  await send(
    '/gestion/configuracion',
    'PUT',
    { cancelacionHoras: 6, reembolsos: 'Coordinar con administración.' },
    admin.token,
  )
  t.mock.timers.enable({ apis: ['Date'], now: instant(fecha, '20:30') })
  assert.equal(
    (await send(`/reservas/${reserva.data.id}`, 'GET', undefined, client.token)).data.puedeCancelar,
    false,
  )
  assert.equal(
    (await send(`/reservas/${reserva.data.id}`, 'DELETE', undefined, client.token)).status,
    409,
  )
  await send('/avisos', 'GET', undefined, client.token)
  const avisos = await send('/avisos', 'GET', undefined, client.token)
  assert.equal(
    avisos.data.filter((item) => item.clave === `recordatorio-${entrada.data.id}`).length,
    1,
  )
  assert.equal(
    (await send(`/gestion/eventos/${created.data.id}`, 'PUT', { estado: 'ACTIVO' }, admin.token))
      .status,
    200,
  )
  assert.equal(
    (await send(`/entradas/${entrada.data.id}`, 'PUT', { estado: 'USADA' }, reception.token))
      .status,
    200,
  )
  assert.equal(
    (await send(`/entradas/${entrada.data.id}`, 'PUT', { estado: 'USADA' }, reception.token))
      .status,
    409,
  )
  assert.equal(
    (
      await send(
        `/gestion/eventos/${created.data.id}`,
        'PUT',
        { estado: 'FINALIZADO' },
        admin.token,
      )
    ).status,
    200,
  )
  t.mock.timers.reset()
})
