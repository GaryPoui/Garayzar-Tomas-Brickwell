import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const path =
  process.env.DATABASE_PATH || fileURLToPath(new URL('../data/brickwell.sqlite', import.meta.url))
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
export const db = new DatabaseSync(path)
db.exec(`
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
let depth = 0
// Synchronous callbacks keep capacity checks and writes inside the same database lock.
export function transaction(work) {
  if (depth) return work()
  db.exec('BEGIN IMMEDIATE')
  depth++
  try {
    const result = work()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  } finally {
    depth--
  }
}
