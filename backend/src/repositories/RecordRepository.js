import { query, transaction } from '../database.js'
const decode = (row) =>
  row ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null
export default class RecordRepository {
  constructor(collection) {
    this.collection = collection
  }
  async findAll() {
    return (
      await query('SELECT data FROM records WHERE collection = $1 ORDER BY id', [this.collection])
    ).map(decode)
  }
  async findById(id) {
    if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
      return null
    return decode(
      (
        await query('SELECT data FROM records WHERE collection = $1 AND id = $2', [
          this.collection,
          Number(id),
        ])
      )[0],
    )
  }
  async create(data) {
    return transaction(async () => {
      const [{ value: id }] = await query(
        'INSERT INTO sequences(collection, value) VALUES ($1, 1) ON CONFLICT(collection) DO UPDATE SET value = sequences.value + 1 RETURNING value',
        [this.collection],
      )
      const record = { ...data, id }
      await query('INSERT INTO records(collection, id, data) VALUES ($1, $2, $3)', [
        this.collection,
        id,
        JSON.stringify(record),
      ])
      return record
    })
  }
  async update(id, data) {
    return transaction(async () => {
      const record = await this.findById(id)
      if (!record) return null
      const updated = { ...record, ...data, id: record.id }
      await query('UPDATE records SET data = $1 WHERE collection = $2 AND id = $3', [
        JSON.stringify(updated),
        this.collection,
        record.id,
      ])
      return updated
    })
  }
  async delete(id) {
    return transaction(async () => {
      const record = await this.findById(id)
      if (record)
        await query('DELETE FROM records WHERE collection = $1 AND id = $2', [
          this.collection,
          record.id,
        ])
      return record
    })
  }
}
