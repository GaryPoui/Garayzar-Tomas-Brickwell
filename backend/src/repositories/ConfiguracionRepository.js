import RecordRepository from './RecordRepository.js'
import { transaction } from '../database.js'
const repository = new RecordRepository('configuracion')
transaction(() => {
  if (!repository.findById(1))
    repository.create({
      cancelacionHoras: 2,
      reembolsos: 'Los reembolsos se coordinan con administración según cada caso.',
    })
})
export default repository
