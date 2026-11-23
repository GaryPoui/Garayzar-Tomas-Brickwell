import Notificaciones from '../repositories/NotificacionRepository.js'
import Usuarios from '../repositories/UsuarioRepository.js'
import Entradas from '../repositories/EntradaRepository.js'
import Eventos from '../repositories/EventoRepository.js'
import { isStaff } from '../utils/roles.js'
import { instant } from '../utils/validation.js'
import { transaction } from '../database.js'
import { NotFoundError } from '../exceptions/AppError.js'

export async function avisar(usuario, mensaje, clave) {
  if (
    clave &&
    (await Notificaciones.findAll()).some(
      (item) => item.clave === clave && item.usuario === usuario,
    )
  )
    return
  await Notificaciones.create({
    usuario,
    mensaje,
    clave,
    fecha: new Date().toISOString(),
    leida: false,
  })
}
export async function avisarPersonal(mensaje) {
  for (const user of (await Usuarios.findAll()).filter((user) => user.activo && isStaff(user)))
    await avisar(user.id, mensaje)
}
export async function recordatorios() {
  return transaction(async () => {
    for (const entrada of (await Entradas.findAll()).filter(
      (item) => item.estado === 'CONFIRMADA',
    )) {
      const evento = await Eventos.findById(entrada.evento)
      if (!evento || !['PUBLICADO', 'ACTIVO'].includes(evento.estado)) continue
      const remaining = instant(evento.fecha, evento.horario) - Date.now()
      if (remaining > 0 && remaining <= 24 * 60 * 60 * 1000)
        await avisar(
          entrada.cliente,
          `Recordatorio: ${evento.nombre}, el ${evento.fecha} a las ${evento.horario}. Entrada #${entrada.id}.`,
          `recordatorio-${entrada.id}`,
        )
    }
  })
}
export default {
  async listar(user) {
    await recordatorios()
    return (await Notificaciones.findAll()).filter((item) => item.usuario === user.id).reverse()
  },
  async leer(id, user) {
    const item = await Notificaciones.findById(id)
    if (!item || item.usuario !== user.id) throw new NotFoundError('El aviso no existe.')
    return await Notificaciones.update(id, { leida: true })
  },
}
