import RecordRepository from './RecordRepository.js'
import seed from './cartaSeed.js'
import { transaction, db } from '../database.js'
const repository = new RecordRepository('carta')
transaction(() => {
  if (!db.prepare('SELECT 1 FROM sequences WHERE collection = ?').get('carta'))
    for (const item of seed) repository.create(item)
})
export default repository
