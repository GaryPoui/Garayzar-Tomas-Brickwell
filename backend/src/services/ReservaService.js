import Reservas from '../repositories/ReservaRepository.js'
import Usuarios from '../repositories/UsuarioRepository.js'
import { prepararMesa } from './CatalogoService.js'
import { avisar, avisarPersonal } from './NotificacionService.js'
import { transaction } from '../database.js'
import { object, date, time, number, text, today, instant, age } from '../utils/validation.js'
import { isStaff, isAdmin } from '../utils/roles.js'
import AppError, { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js'
import Reserva from '../models/Reserva.js'
import Configuracion from './ConfiguracionService.js'

export const transitions = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ACTIVA', 'CANCELADA'],
  ACTIVA: ['FINALIZADA'],
  FINALIZADA: [],
  CANCELADA: [],
}
const same = (field, a, b) =>
  field === 'combos'
    ? Array.isArray(a) &&
      Array.isArray(b) &&
      JSON.stringify(
        a.map((item) => ({ id: item?.id, cantidad: item?.cantidad })).sort((x, y) => x.id - y.id),
      ) ===
        JSON.stringify(
          b.map((item) => ({ id: item?.id, cantidad: item?.cantidad })).sort((x, y) => x.id - y.id),
        )
    : a === b
async function titular(id) {
  const user = await Usuarios.findById(id)
  if (!user?.activo || user.rol !== 'CLIENTE')
    throw new BadRequestError('Seleccioná un cliente activo.')
  age(user.fechaNacimiento)
  return user
}
async function duplicada(data, excluir) {
  if (
    ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(data.estado) &&
    (await Reservas.findAll()).some(
      (item) =>
        item.id !== excluir &&
        item.cliente === data.cliente &&
        item.fecha === data.fecha &&
        ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(item.estado),
    )
  )
    throw new ConflictError('El cliente ya tiene una reserva vigente para esa fecha.')
}
function importes(data) {
  const descuento = number(data.descuento ?? 0, 'Descuento (%)', 0, 100)
  const precioTotal = Math.round(data.precioBase * (1 - descuento / 100) * 100) / 100
  const anticipo = number(data.anticipo ?? 0, 'Anticipo', 0, precioTotal)
  return { descuento, precioTotal, anticipo }
}
class ReservaService {
  async presentar(item, user) {
    if (isStaff(user)) return item
    const { notas: _notas, ...publico } = item
    return {
      ...publico,
      puedeCancelar:
        ['PENDIENTE', 'CONFIRMADA'].includes(item.estado) &&
        instant(item.fecha, item.horario) - Date.now() >=
          (await Configuracion.obtener()).cancelacionHoras * 60 * 60 * 1000,
    }
  }
  async obtenerTodas(user) {
    return Promise.all(
      (await Reservas.findAll())
        .filter((item) => isStaff(user) || item.cliente === user.id)
        .map((item) => this.presentar(item, user)),
    )
  }
  async obtenerPorId(id) {
    const item = await Reservas.findById(id)
    if (!item) throw new NotFoundError('La reserva no existe.')
    return item
  }
  async obtenerPropia(id, cliente) {
    const item = await this.obtenerPorId(id)
    if (item.cliente !== cliente) throw new NotFoundError('La reserva no existe.')
    return item
  }
  async consultar(id, user) {
    return await this.presentar(
      isStaff(user) ? await this.obtenerPorId(id) : await this.obtenerPropia(id, user.id),
      user,
    )
  }
  async crear(datos, actor) {
    return transaction(async () => {
      object(datos)
      const cliente = isStaff(actor) ? number(datos.cliente, 'Cliente', 1, 1000000, true) : actor.id
      await titular(cliente)
      date(datos.fecha)
      time(datos.horario)
      if (datos.fecha <= today()) throw new BadRequestError('La fecha debe ser a partir de mañana.')
      if (datos.anticipo !== undefined) number(datos.anticipo, 'Anticipo')
      if (datos.descuento !== undefined) number(datos.descuento, 'Descuento', 0, 100)
      if (!isStaff(actor) && (datos.anticipo || datos.descuento))
        throw new AppError('Solo el personal puede registrar anticipos o descuentos.', 403)
      const data = {
        ...datos,
        cliente,
        estado: 'PENDIENTE',
        descuento: isStaff(actor) ? (datos.descuento ?? 0) : 0,
        anticipo: isStaff(actor) ? (datos.anticipo ?? 0) : 0,
      }
      const seleccion = await prepararMesa(data)
      Object.assign(data, seleccion)
      Object.assign(data, importes(data))
      await duplicada(data)
      const reserva = await Reservas.create(
        Object.assign(
          new Reserva(
            null,
            data.fecha,
            data.horario,
            data.estado,
            cliente,
            data.sector,
            data.paquete,
            data.precioTotal,
            data.anticipo,
          ),
          seleccion,
          importes(data),
          { notas: '', creada: new Date().toISOString() },
        ),
      )
      await avisar(cliente, `Tu reserva #${reserva.id} está pendiente de confirmación.`)
      await avisarPersonal(
        `Nueva reserva #${reserva.id} de ${(await titular(cliente)).nombre}, para el ${reserva.fecha}.`,
      )
      return reserva
    })
  }
  async modificar(id, datos, actor) {
    return transaction(async () => {
      object(datos)
      const current = await this.obtenerPorId(id)
      if (!isStaff(actor)) throw new AppError('Esta acción requiere permisos del personal.', 403)
      if (!transitions[current.estado]?.length)
        throw new ConflictError('Una reserva finalizada o cancelada no se puede modificar.')
      const estado = datos.estado ?? current.estado
      if (!Object.hasOwn(transitions, estado))
        throw new BadRequestError('Seleccioná un estado válido.')
      if (estado !== current.estado && !transitions[current.estado].includes(estado))
        throw new ConflictError(`No se puede pasar de ${current.estado} a ${estado}.`)
      if (estado === 'CONFIRMADA') await titular(current.cliente)
      if (estado === 'ACTIVA' && current.fecha !== today())
        throw new ConflictError('El check-in solo se puede registrar el día de la reserva.')
      const data = { ...current }
      for (const field of [
        'fecha',
        'horario',
        'mesa',
        'personas',
        'combos',
        'anticipo',
        'descuento',
        'notas',
      ])
        if (datos[field] !== undefined) data[field] = datos[field]
      data.estado = estado
      if (datos.fecha !== undefined && datos.fecha !== current.fecha) {
        date(datos.fecha)
        if (datos.fecha <= today())
          throw new BadRequestError('La nueva fecha debe ser a partir de mañana.')
      }
      time(data.horario)
      number(data.mesa, 'Mesa', 1, 1000000, true)
      number(data.personas, 'Personas', 1, 20, true)
      if (
        current.estado === 'ACTIVA' &&
        ['fecha', 'horario', 'mesa', 'personas', 'combos'].some(
          (field) => datos[field] !== undefined && !same(field, datos[field], current[field]),
        )
      )
        throw new ConflictError('No se puede cambiar la mesa ni los datos de una reserva en uso.')
      if (datos.notas !== undefined) data.notas = text(datos.notas, 'Notas', 0, 1000)
      // Preserve the agreed prices unless the booked products actually change.
      const changed = ['mesa', 'combos'].some(
        (field) => datos[field] !== undefined && !same(field, datos[field], current[field]),
      )
      if (changed) Object.assign(data, await prepararMesa(data, current.id))
      else {
        if (['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(estado))
          await prepararMesa(data, current.id)
        data.combos = current.combos
      }
      Object.assign(data, importes(data))
      await duplicada(data, current.id)
      const result = await Reservas.update(id, data)
      if (estado !== current.estado)
        await avisar(current.cliente, `Tu reserva #${id} cambió a ${estado.toLowerCase()}.`)
      return result
    })
  }
  async eliminar(id, actor) {
    if (!isAdmin(actor))
      throw new AppError('Solo administración puede eliminar definitivamente una reserva.', 403)
    return transaction(async () => {
      const item = await this.obtenerPorId(id)
      if (item.estado === 'ACTIVA') throw new ConflictError('Finalizá la mesa antes de eliminarla.')
      await avisar(
        item.cliente,
        `Administración eliminó la reserva #${id}. Contactá al local por cualquier anticipo.`,
      )
      return await Reservas.delete(id)
    })
  }
  async cancelarPropia(id, user) {
    return transaction(async () => {
      const reserva = await this.obtenerPropia(id, user.id)
      if (!['PENDIENTE', 'CONFIRMADA'].includes(reserva.estado))
        throw new ConflictError('Solo podés cancelar reservas pendientes o confirmadas.')
      const horas = (await Configuracion.obtener()).cancelacionHoras
      if (instant(reserva.fecha, reserva.horario) - Date.now() < horas * 60 * 60 * 1000)
        throw new ConflictError(`Solo podés cancelar con al menos ${horas} horas de anticipación.`)
      const updated = await Reservas.update(id, { estado: 'CANCELADA' })
      await avisar(
        user.id,
        `Cancelaste la reserva #${id}. Cualquier reembolso se coordina con el local.`,
      )
      await avisarPersonal(`${user.nombre} canceló la reserva #${id}.`)
      return await this.presentar(updated, user)
    })
  }
}
export default new ReservaService()
