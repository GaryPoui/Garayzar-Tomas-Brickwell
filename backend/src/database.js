import { AsyncLocalStorage } from 'node:async_hooks'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const context = new AsyncLocalStorage()
export const storage = process.env.DATABASE_URL ? 'postgres' : 'sqlite'
let pool
let sqlite
if (storage === 'postgres') {
  const { default: pg } = await import('pg')
  const url = new URL(process.env.DATABASE_URL)
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key)
  const ca =
    process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n') ||
    readFileSync(new URL('../certs/supabase-ca.crt', import.meta.url), 'utf8')
  pool = new pg.Pool({
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
    max: 4,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
    options: '-c search_path=brickwell -c statement_timeout=15000 -c lock_timeout=10000',
  })
  pool.on('error', (error) => console.error('Conexión PostgreSQL interrumpida:', error.code))
  await pool.query('SELECT collection FROM records LIMIT 0')
} else {
  if (process.env.RENDER && process.env.ALLOW_EPHEMERAL_SQLITE !== 'true')
    throw new Error(
      'Configurá DATABASE_URL para conservar los datos en Supabase. SQLite en Render requiere ALLOW_EPHEMERAL_SQLITE=true explícito.',
    )
  const { DatabaseSync } = await import('node:sqlite')
  const path =
    process.env.DATABASE_PATH || fileURLToPath(new URL('../data/brickwell.sqlite', import.meta.url))
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  sqlite = new DatabaseSync(path)
  sqlite.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS records (
    collection TEXT NOT NULL, id INTEGER NOT NULL,
    data TEXT NOT NULL CHECK(json_valid(data)), PRIMARY KEY(collection, id)
  );
  CREATE TABLE IF NOT EXISTS sequences (collection TEXT PRIMARY KEY, value INTEGER NOT NULL);
  CREATE UNIQUE INDEX IF NOT EXISTS user_email ON records(json_extract(data, '$.email')) WHERE collection = 'usuarios';
  CREATE UNIQUE INDEX IF NOT EXISTS session_token ON records(json_extract(data, '$.key')) WHERE collection = 'sesiones';
  CREATE UNIQUE INDEX IF NOT EXISTS reserved_table ON records(json_extract(data, '$.mesa'), json_extract(data, '$.fecha'))
    WHERE collection = 'reservas' AND json_extract(data, '$.estado') IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVA');
  CREATE UNIQUE INDEX IF NOT EXISTS customer_night ON records(json_extract(data, '$.cliente'), json_extract(data, '$.fecha'))
    WHERE collection = 'reservas' AND json_extract(data, '$.estado') IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVA');
  CREATE UNIQUE INDEX IF NOT EXISTS event_ticket ON records(json_extract(data, '$.cliente'), json_extract(data, '$.evento'))
    WHERE collection = 'entradas' AND json_extract(data, '$.estado') != 'CANCELADA';
`)
}

// A single SQLite connection must not interleave asynchronous transactions.
let pending = Promise.resolve()
function exclusive(work) {
  const result = pending.then(work)
  pending = result.catch(() => {})
  return result
}
export async function query(sql, values = []) {
  const connection = context.getStore()
  if (pool) return (await (connection || pool).query(sql, values)).rows
  const execute = () => sqlite.prepare(sql.replace(/\$\d+/g, '?')).all(...values)
  return connection ? execute() : exclusive(execute)
}
export async function transaction(work) {
  if (context.getStore()) return work()
  if (pool) {
    const connection = await pool.connect()
    try {
      await connection.query('BEGIN')
      // Serialize business writes across API instances, including capacity checks.
      await connection.query('SELECT pg_advisory_xact_lock(171023001)')
      const result = await context.run(connection, work)
      await connection.query('COMMIT')
      return result
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    } finally {
      connection.release()
    }
  }
  return exclusive(async () => {
    sqlite.exec('BEGIN IMMEDIATE')
    try {
      const result = await context.run(sqlite, work)
      sqlite.exec('COMMIT')
      return result
    } catch (error) {
      sqlite.exec('ROLLBACK')
      throw error
    }
  })
}
export const hasSequence = async (collection) =>
  (await query('SELECT 1 FROM sequences WHERE collection = $1', [collection])).length > 0
export async function closeDatabase() {
  if (pool) await pool.end()
  else {
    await pending
    sqlite.close()
  }
}
