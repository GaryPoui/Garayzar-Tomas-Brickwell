import RecordRepository from './RecordRepository.js'
import seed from './catalogoSeed.js'
import { transaction, db } from '../database.js'
export const sectores = new RecordRepository('sectores')
export const mesas = new RecordRepository('mesas')
export const paquetes = new RecordRepository('paquetes')
transaction(() => {
  for (const [name, repository] of Object.entries({ sectores, mesas, paquetes })) {
    if (!db.prepare('SELECT 1 FROM sequences WHERE collection = ?').get(name))
      for (const item of seed[name]) repository.create(item)
  }
})
export default {
  obtener() {
    return {
      moneda: 'ARS',
      referencia: 'Plano orientativo y tarifas de referencia, sujetos a confirmación del local.',
      sectores: sectores.findAll(),
      mesas: mesas.findAll(),
      paquetes: paquetes.findAll(),
    }
  },
}
