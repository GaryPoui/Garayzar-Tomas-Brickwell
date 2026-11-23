import Notificaciones from '../repositories/NotificacionRepository.js'
import Usuarios from '../repositories/UsuarioRepository.js'
import Entradas from '../repositories/EntradaRepository.js'
import Eventos from '../repositories/EventoRepository.js'
import { isStaff } from '../utils/roles.js'
import { instant } from '../utils/validation.js'
import { transaction } from '../database.js'
import { NotFoundError } from '../exceptions/AppError.js'

export function avisar(usuario, mensaje, clave) {
  if (
    clave &&
    Notificaciones.findAll().some((item) => item.clave === clave && item.usuario === usuario)
  )
    return
  Notificaciones.create({ usuario, mensaje, clave, fecha: new Date().toISOString(), leida: false })
}
export function avisarPersonal(mensaje) {
  for (const user of Usuarios.findAll().filter((user) => user.activo && isStaff(user)))
    avisar(user.id, mensaje)
}
export function recordatorios() {
  transaction(() => {
    for (const entrada of Entradas.findAll().filter((item) => item.estado === 'CONFIRMADA')) {
      const evento = Eventos.findById(entrada.evento)
      if (!evento || !['PUBLICADO', 'ACTIVO'].includes(evento.estado)) continue
      const remaining = instant(evento.fecha, evento.horario) - Date.now()
      if (remaining > 0 && remaining <= 24 * 60 * 60 * 1000)
        avisar(
          entrada.cliente,
          `Recordatorio: ${evento.nombre}, el ${evento.fecha} a las ${evento.horario}. Entrada #${entrada.id}.`,
          `recordatorio-${entrada.id}`,
        )
    }
  })
}
export default {
  listar(user) {
    recordatorios()
    return Notificaciones.findAll()
      .filter((item) => item.usuario === user.id)
      .reverse()
  },
  leer(id, user) {
    const item = Notificaciones.findById(id)
    if (!item || item.usuario !== user.id) throw new NotFoundError('El aviso no existe.')
    return Notificaciones.update(id, { leida: true })
  },
}
