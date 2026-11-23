import RecordRepository from './RecordRepository.js'
import { transaction } from '../database.js'
const repository = new RecordRepository('configuracion')
await transaction(async () => {
  if (!(await repository.findById(1)))
    await repository.create({
      cancelacionHoras: 2,
      reembolsos: 'Los reembolsos se coordinan con administración según cada caso.',
    })
})
export default repository
