import RecordRepository from './RecordRepository.js'
import seed from './catalogoSeed.js'
import { transaction, hasSequence } from '../database.js'
export const sectores = new RecordRepository('sectores')
export const mesas = new RecordRepository('mesas')
export const paquetes = new RecordRepository('paquetes')
await transaction(async () => {
  for (const [name, repository] of Object.entries({
    sectores,
    mesas,
    paquetes,
  })) {
    if (!(await hasSequence(name))) for (const item of seed[name]) await repository.create(item)
  }
})
export default {
  async obtener() {
    return {
      moneda: 'ARS',
      referencia: 'Plano orientativo y tarifas de referencia, sujetos a confirmación del local.',
      sectores: await sectores.findAll(),
      mesas: await mesas.findAll(),
      paquetes: await paquetes.findAll(),
    }
  },
}
