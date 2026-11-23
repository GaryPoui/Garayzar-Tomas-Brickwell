import Reservas from '../services/ReservaService.js'
import { handler } from './handler.js'
import { isStaff } from '../utils/roles.js'
export default {
  obtenerTodas: handler((req) => Reservas.obtenerTodas(req.user)),
  obtenerPorId: handler((req) => Reservas.consultar(req.params.id, req.user)),
  crear: handler((req) => Reservas.crear(req.body, req.user), 201),
  modificar: handler((req) => Reservas.modificar(req.params.id, req.body, req.user)),
  eliminar: handler((req) =>
    isStaff(req.user)
      ? Reservas.eliminar(req.params.id, req.user)
      : Reservas.cancelarPropia(req.params.id, req.user),
  ),
}
