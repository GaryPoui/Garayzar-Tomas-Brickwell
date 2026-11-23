import Configuracion from '../repositories/ConfiguracionRepository.js'
import { object, number, text } from '../utils/validation.js'
export default {
  async obtener() {
    return await Configuracion.findById(1)
  },
  async guardar(data) {
    object(data)
    return await Configuracion.update(1, {
      cancelacionHoras: number(data.cancelacionHoras, 'Horas mínimas para cancelar', 2, 168, true),
      reembolsos: text(data.reembolsos, 'Política de reembolsos', 10, 1000),
    })
  },
}
