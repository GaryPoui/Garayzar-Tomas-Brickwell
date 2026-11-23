import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'

if (!process.env.DATABASE_URL)
  throw new Error('test:cloud requiere DATABASE_URL de una base de pruebas.')
// This opt-in suite creates only uniquely named fixtures and removes them in finally.
const { default: app } = await import('../src/app.js')
const { query, transaction, closeDatabase, storage } = await import('../src/database.js')
const { createUser } = await import('../src/services/AuthService.js')
const { default: Repo } = await import('../src/repositories/RecordRepository.js')
const authUrl = new URL('../src/services/AuthService.js', import.meta.url).href
const dbUrl = new URL('../src/database.js', import.meta.url).href
const bookingUrl = new URL('../src/services/ReservaService.js', import.meta.url).href
const ticketUrl = new URL('../src/services/EntradaService.js', import.meta.url).href

function worker(work) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import {closeDatabase} from ${JSON.stringify(dbUrl)};
      try { ${work} } catch(error) { console.log(JSON.stringify({status:error.statusCode || 500})); }
      finally { await closeDatabase(); }
    `,
      ],
      { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk
    })
    child.stderr.on('data', () => {})
    child.on('error', reject)
    child.on('exit', (code) => {
      try {
        assert.equal(code, 0)
        resolve(JSON.parse(output.trim()))
      } catch (error) {
        reject(error)
      }
    })
  })
}

test('Supabase: HTTP real, reinicio, duplicados y cupo entre procesos, rollback y revocación', async () => {
  assert.equal(storage, 'postgres')
  const tag = randomUUID()
  const users = []
  let eventId
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  async function send(path, method = 'GET', data, token) {
    const response = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    })
    return { status: response.status, ...(await response.json()) }
  }
  const account = (suffix) => ({
    nombre: `Prueba cloud ${suffix}`,
    email: `${tag}-${suffix}@example.com`,
    password: 'Cloud-testing-12345',
    fechaNacimiento: '2000-01-01',
    telefono: '2262551234',
  })
  try {
    const admin = await createUser(account('admin'), 'ADMIN')
    users.push(admin.id)
    const adminSession = (await send('/auth/login', 'POST', account('admin'))).data
    const a = await send('/auth/registro', 'POST', account('a'))
    const b = await send('/auth/registro', 'POST', account('b'))
    assert.equal(a.status, 201)
    assert.equal(b.status, 201)
    users.push(a.data.user.id, b.data.user.id)
    assert.equal(a.data.user.hash, undefined)
    assert.equal((await send('/auth/registro', 'POST', account('a'))).status, 409)
    assert.deepEqual(
      await worker(
        `const auth=await import(${JSON.stringify(authUrl)});const result=await auth.authenticate(${JSON.stringify(a.data.token)});console.log(JSON.stringify({id:result.user.id}));`,
      ),
      { id: a.data.user.id },
    )
    assert.equal(
      (await send('/perfil', 'PUT', { nombre: 'Perfil persistente' }, a.data.token)).status,
      200,
    )
    assert.deepEqual(
      await worker(
        `const auth=await import(${JSON.stringify(authUrl)});const result=await auth.authenticate(${JSON.stringify(a.data.token)});console.log(JSON.stringify({nombre:result.user.nombre}));`,
      ),
      { nombre: 'Perfil persistente' },
    )

    const booking = { fecha: '2099-12-28', horario: '23:30', mesa: 1, personas: 2, combos: [] }
    const reservations = await Promise.all(
      [a, b].map(({ data }) =>
        worker(
          `const {default:service}=await import(${JSON.stringify(bookingUrl)});const result=await service.crear(${JSON.stringify(booking)},${JSON.stringify(data.user)});console.log(JSON.stringify({status:201,id:result.id,cliente:result.cliente}));`,
        ),
      ),
    )
    assert.deepEqual(reservations.map((item) => item.status).sort(), [201, 409])
    const winner = reservations.find((item) => item.status === 201)
    const owner = [a, b].find((item) => item.data.user.id === winner.cliente).data
    const other = [a, b].find((item) => item.data.user.id !== winner.cliente).data
    assert.equal((await send(`/reservas/${winner.id}`, 'GET', undefined, other.token)).status, 404)
    assert.equal(
      (await send('/catalogo?fecha=2099-12-28')).data.mesas.find((item) => item.id === 1)
        .disponible,
      false,
    )
    assert.equal(
      (await send(`/reservas/${winner.id}`, 'DELETE', undefined, owner.token)).data.estado,
      'CANCELADA',
    )
    assert.equal(
      (await send('/catalogo?fecha=2099-12-28')).data.mesas.find((item) => item.id === 1)
        .disponible,
      true,
    )

    const event = await send(
      '/gestion/eventos',
      'POST',
      {
        nombre: `Cloud ${tag}`,
        descripcion: 'Evento aislado de prueba de cupo',
        fecha: '2099-12-29',
        horario: '23:00',
        capacidadMaxima: 1,
        precioEntrada: 0,
        precioPuerta: 0,
      },
      adminSession.token,
    )
    assert.equal(event.status, 201)
    eventId = event.data.id
    assert.equal(
      (
        await send(
          `/gestion/eventos/${eventId}`,
          'PUT',
          { estado: 'PUBLICADO' },
          adminSession.token,
        )
      ).status,
      200,
    )
    const tickets = await Promise.all(
      [a, b].map(({ data }) =>
        worker(
          `const {default:service}=await import(${JSON.stringify(ticketUrl)});const result=await service.comprar(${eventId},${JSON.stringify(data.user)});console.log(JSON.stringify({status:201,id:result.id}));`,
        ),
      ),
    )
    assert.deepEqual(tickets.map((item) => item.status).sort(), [201, 409])
    assert.equal((await send(`/eventos/${eventId}`)).data.entradasDisponibles, 0)
    const rollback = new Repo(`test-${tag}`)
    await assert.rejects(
      transaction(async () => {
        await rollback.create({ nombre: 'rollback' })
        await Promise.resolve()
        throw new Error('rollback esperado')
      }),
      /rollback esperado/,
    )
    assert.deepEqual(await rollback.findAll(), [])
    assert.equal((await send('/auth/logout', 'POST', undefined, a.data.token)).status, 200)
    assert.deepEqual(
      await worker(
        `const auth=await import(${JSON.stringify(authUrl)});await auth.authenticate(${JSON.stringify(a.data.token)});console.log(JSON.stringify({status:200}));`,
      ),
      { status: 401 },
    )
  } finally {
    await transaction(async () => {
      const ids = new Set(users)
      for (const collection of ['sesiones', 'reservas', 'entradas', 'notificaciones', 'usuarios']) {
        const repo = new Repo(collection)
        for (const item of await repo.findAll()) {
          if (
            (collection === 'usuarios' && item.email?.startsWith(tag)) ||
            ids.has(item.usuario) ||
            ids.has(item.cliente)
          )
            await repo.delete(item.id)
        }
      }
      if (eventId) await new Repo('eventos').delete(eventId)
      await query('DELETE FROM sequences WHERE collection = $1', [`test-${tag}`])
    })
    await new Promise((resolve) => server.close(resolve))
    await closeDatabase()
  }
})
