import Usuarios from '../repositories/UsuarioRepository.js'
import Sesiones from '../repositories/SesionRepository.js'
import Reservas from '../repositories/ReservaRepository.js'
import Entradas from '../repositories/EntradaRepository.js'
import Eventos from '../repositories/EventoRepository.js'
import { createUser } from './AuthService.js'
import { publicUser } from '../utils/roles.js'
import { object, text, age, phone, boolean } from '../utils/validation.js'
import { transaction } from '../database.js'
import { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js'
const roles = ['CLIENTE', 'RECEPCIONISTA', 'ADMIN']
export default {
  listar() {
    return Usuarios.findAll().map(publicUser)
  },
  clientes() {
    return Usuarios.findAll()
      .filter((user) => user.activo && user.rol === 'CLIENTE')
      .map(publicUser)
  },
  async crear(data) {
    object(data)
    if (!roles.includes(data.rol)) throw new BadRequestError('Seleccioná un rol válido.')
    return publicUser(await createUser(data, data.rol))
  },
  modificar(id, data, actor, propio = false) {
    return transaction(() => {
      object(data)
      const user = Usuarios.findById(id)
      if (!user) throw new NotFoundError('El usuario no existe.')
      if (
        !propio &&
        user.id === actor.id &&
        (data.activo === false || (data.rol !== undefined && data.rol !== 'ADMIN'))
      )
        throw new ConflictError(
          'No podés desactivar ni quitar los permisos de tu propia cuenta de administración.',
        )
      const updated = {
        nombre: text(data.nombre ?? user.nombre, 'Nombre', 2, 80),
        telefono: phone(data.telefono ?? user.telefono),
        fechaNacimiento: data.fechaNacimiento ?? user.fechaNacimiento,
      }
      age(updated.fechaNacimiento)
      if (!propio) {
        updated.rol = data.rol ?? user.rol
        updated.activo =
          data.activo === undefined ? user.activo : boolean(data.activo, 'Cuenta activa')
        if (!roles.includes(updated.rol)) throw new BadRequestError('Seleccioná un rol válido.')
        if (user.id === actor.id && (!updated.activo || updated.rol !== 'ADMIN'))
          throw new ConflictError(
            'No podés desactivar ni quitar los permisos de tu propia cuenta de administración.',
          )
        if (
          user.rol === 'CLIENTE' &&
          updated.rol !== 'CLIENTE' &&
          Reservas.findAll().some(
            (item) =>
              item.cliente === user.id &&
              ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(item.estado),
          )
        )
          throw new ConflictError(
            'El cliente tiene reservas vigentes. Cerrá esas reservas antes de cambiar su rol.',
          )
      }
      if (updated.activo === false || (updated.rol && updated.rol !== user.rol))
        Sesiones.revokeUser(user.id)
      return publicUser(Usuarios.update(id, updated))
    })
  },
  historial(id, interno = false) {
    const user = Usuarios.findById(id)
    if (!user) throw new NotFoundError('El usuario no existe.')
    return {
      usuario: publicUser(user),
      reservas: Reservas.findAll()
        .filter((item) => item.cliente === user.id)
        .map((item) => {
          if (interno) return item
          const { notas, ...publico } = item
          return publico
        }),
      entradas: Entradas.findAll()
        .filter((item) => item.cliente === user.id)
        .map((item) => ({ ...item, detalleEvento: Eventos.findById(item.evento) })),
    }
  },
}
