import { db, transaction } from '../database.js'
export default class RecordRepository {
  constructor(collection) {
    this.collection = collection
  }
  findAll() {
    return db
      .prepare('SELECT data FROM records WHERE collection = ? ORDER BY id')
      .all(this.collection)
      .map((row) => JSON.parse(row.data))
  }
  findById(id) {
    if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
      return null
    const row = db
      .prepare('SELECT data FROM records WHERE collection = ? AND id = ?')
      .get(this.collection, Number(id))
    return row ? JSON.parse(row.data) : null
  }
  create(data) {
    return transaction(() => {
      const { value: id } = db
        .prepare(
          'INSERT INTO sequences(collection, value) VALUES (?, 1) ON CONFLICT(collection) DO UPDATE SET value = value + 1 RETURNING value',
        )
        .get(this.collection)
      const record = { ...data, id }
      db.prepare('INSERT INTO records(collection, id, data) VALUES (?, ?, ?)').run(
        this.collection,
        id,
        JSON.stringify(record),
      )
      return record
    })
  }
  update(id, data) {
    const record = this.findById(id)
    if (!record) return null
    const updated = { ...record, ...data, id: record.id }
    db.prepare('UPDATE records SET data = ? WHERE collection = ? AND id = ?').run(
      JSON.stringify(updated),
      this.collection,
      record.id,
    )
    return updated
  }
  delete(id) {
    const record = this.findById(id)
    if (record)
      db.prepare('DELETE FROM records WHERE collection = ? AND id = ?').run(
        this.collection,
        record.id,
      )
    return record
  }
}
