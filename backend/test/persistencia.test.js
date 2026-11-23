import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
test('SQLite conserva registros y secuencias al reiniciar el proceso', () => {
  const directory = mkdtempSync(join(tmpdir(), 'brickwell-persistence-'))
  const path = join(directory, 'test.sqlite')
  const module = new URL('../src/repositories/RecordRepository.js', import.meta.url).href
  const authModule = new URL('../src/services/AuthService.js', import.meta.url).href
  const bookingModule = new URL('../src/services/ReservaService.js', import.meta.url).href
  const run = (code) =>
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import Repo from ${JSON.stringify(module)};const repo=new Repo('prueba');${code}`,
      ],
      { env: { ...process.env, DATABASE_PATH: path }, encoding: 'utf8' },
    ).trim()
  try {
    assert.equal(run("console.log(repo.create({nombre:'Persistente'}).id)"), '1')
    assert.equal(run('console.log(repo.findById(1).nombre)'), 'Persistente')
    assert.equal(run("repo.delete(1);console.log(repo.create({nombre:'Nuevo'}).id)"), '2')
    const saved = JSON.parse(
      run(`
      const auth = await import(${JSON.stringify(authModule)});
      const {default:reservas} = await import(${JSON.stringify(bookingModule)});
      const session = await auth.register({nombre:'Cliente persistente',email:'persistencia@example.com',password:'Persistencia-test-123',fechaNacimiento:'2000-01-01',telefono:'2262551234'});
      const reserva = reservas.crear({fecha:'2099-12-20',horario:'23:30',mesa:1,personas:2,combos:[]},session.user);
      console.log(JSON.stringify({token:session.token,id:reserva.id}));
    `),
    )
    const restored = JSON.parse(
      run(`
      const auth = await import(${JSON.stringify(authModule)});
      const {default:reservas} = await import(${JSON.stringify(bookingModule)});
      const session = auth.authenticate(${JSON.stringify(saved.token)});
      console.log(JSON.stringify({nombre:session.user.nombre,mesa:reservas.consultar(${saved.id},session.user).mesa}));
    `),
    )
    assert.deepEqual(restored, { nombre: 'Cliente persistente', mesa: 1 })
  } finally {
    for (const suffix of ['', '-wal', '-shm'])
      if (existsSync(path + suffix)) unlinkSync(path + suffix)
    rmdirSync(directory)
  }
})
