import { test } from 'node:test'
import assert from 'node:assert/strict'
process.env.DATABASE_PATH = ':memory:'
delete process.env.DATABASE_URL
const { transaction, query } = await import('../src/database.js')
const { default: Repo } = await import('../src/repositories/RecordRepository.js')

test('rollback revierte escrituras anidadas y secuencias, sin dejar una transacción abierta', async () => {
  const repo = new Repo('rollback')
  await assert.rejects(
    transaction(async () => {
      await repo.create({ nombre: 'Temporal' })
      await transaction(async () => {
        await repo.create({ nombre: 'Anidado' })
      })
      throw new Error('fallo esperado')
    }),
    /fallo esperado/,
  )
  assert.deepEqual(await repo.findAll(), [])
  assert.equal((await repo.create({ nombre: 'Persistido' })).id, 1)
})

test('lecturas concurrentes esperan el commit y no observan datos sin confirmar en SQLite', async () => {
  const repo = new Repo('aislamiento')
  let release
  let entered
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const ready = new Promise((resolve) => {
    entered = resolve
  })
  const writing = transaction(async () => {
    await repo.create({ nombre: 'Confirmado' })
    entered()
    await gate
  })
  await ready
  let readFinished = false
  const reading = repo.findAll().then((items) => {
    readFinished = true
    return items
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(readFinished, false)
  release()
  await writing
  assert.equal((await reading)[0].nombre, 'Confirmado')
})

test('el índice de email revierte un alta duplicada y la base continúa utilizable', async () => {
  const repo = new Repo('usuarios')
  await repo.create({ email: 'unico@example.com' })
  await assert.rejects(repo.create({ email: 'unico@example.com' }), /UNIQUE constraint/)
  assert.equal((await repo.create({ email: 'otro@example.com' })).id, 2)
  assert.equal(
    (await query('SELECT count(*) AS total FROM records WHERE collection = $1', ['usuarios']))[0]
      .total,
    2,
  )
})
