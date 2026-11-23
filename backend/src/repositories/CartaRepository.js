import RecordRepository from './RecordRepository.js'
import seed from './cartaSeed.js'
import { transaction, hasSequence } from '../database.js'
const repository = new RecordRepository('carta')
await transaction(async () => {
  if (!(await hasSequence('carta'))) for (const item of seed) await repository.create(item)
})
export default repository
