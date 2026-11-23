import Configuracion from '../repositories/ConfiguracionRepository.js'
import { object, number, text } from '../utils/validation.js'
export default {
  obtener() {
    return Configuracion.findById(1)
  },
  guardar(data) {
    object(data)
    return Configuracion.update(1, {
      cancelacionHoras: number(data.cancelacionHoras, 'Horas mínimas para cancelar', 2, 168, true),
      reembolsos: text(data.reembolsos, 'Política de reembolsos', 10, 1000),
    })
  },
}
