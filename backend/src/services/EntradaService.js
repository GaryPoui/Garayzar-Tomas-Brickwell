import { randomUUID } from 'node:crypto'
import Entradas from '../repositories/EntradaRepository.js'
import Eventos from '../repositories/EventoRepository.js'
import EventoService from './EventoService.js'
import { avisar, avisarPersonal } from './NotificacionService.js'
import { isStaff } from '../utils/roles.js'
import { age, instant, today, object } from '../utils/validation.js'
import { transaction } from '../database.js'
import AppError, { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js'
import Entrada from '../models/Entrada.js'
export default {
  listar(user) {
    return Entradas.findAll()
      .filter((item) => isStaff(user) || item.cliente === user.id)
      .map((item) => ({
        ...item,
        detalleEvento: Eventos.findById(item.evento) || item.detalleEvento,
      }))
  },
  comprar(id, user) {
    return transaction(() => {
      if (user.rol !== 'CLIENTE')
        throw new AppError('Las entradas se solicitan desde una cuenta de cliente.', 403)
      age(user.fechaNacimiento)
      const evento = EventoService.obtener(id)
      if (evento.estado !== 'PUBLICADO' || instant(evento.fecha, evento.horario) <= Date.now())
        throw new ConflictError('La venta anticipada está cerrada.')
      if (
        Entradas.findAll().some(
          (item) =>
            item.evento === evento.id && item.cliente === user.id && item.estado !== 'CANCELADA',
        )
      )
        throw new ConflictError('Ya tenés una entrada para este evento.')
      if (evento.entradasDisponibles <= 0) throw new ConflictError('Las entradas están agotadas.')
      const entrada = Entradas.create(
        Object.assign(
          new Entrada(
            null,
            user.id,
            evento.id,
            new Date().toISOString(),
            evento.precioEntrada,
            evento.precioEntrada === 0 ? 'CONFIRMADA' : 'PENDIENTE_PAGO',
          ),
          { codigo: randomUUID(), detalleEvento: evento },
        ),
      )
      avisar(
        user.id,
        `Entrada #${entrada.id} para ${evento.nombre}: ${entrada.estado === 'CONFIRMADA' ? 'confirmada, sin cargo' : 'pendiente de pago en el local'}.`,
      )
      avisarPersonal(`Nueva entrada #${entrada.id} para ${evento.nombre}.`)
      return entrada
    })
  },
  modificar(id, datos, user) {
    return transaction(() => {
      object(datos)
      const item = Entradas.findById(id)
      if (!item || (!isStaff(user) && item.cliente !== user.id))
        throw new NotFoundError('La entrada no existe.')
      if (!['PENDIENTE_PAGO', 'CONFIRMADA'].includes(item.estado))
        throw new ConflictError('La entrada ya fue utilizada o cancelada.')
      const evento = Eventos.findById(item.evento)
      const estado = datos.estado
      if (!['CONFIRMADA', 'USADA', 'CANCELADA'].includes(estado))
        throw new BadRequestError('Seleccioná un estado válido.')
      if (!isStaff(user) && estado !== 'CANCELADA')
        throw new AppError('Solo el personal puede acreditar pagos y registrar ingresos.', 403)
      if (
        estado === 'CONFIRMADA' &&
        (item.estado !== 'PENDIENTE_PAGO' || evento.estado !== 'PUBLICADO')
      )
        throw new ConflictError(
          'Solo se puede acreditar una entrada pendiente de un evento publicado.',
        )
      if (
        estado === 'USADA' &&
        (item.estado !== 'CONFIRMADA' ||
          evento.fecha !== today() ||
          !['PUBLICADO', 'ACTIVO'].includes(evento.estado))
      )
        throw new ConflictError('El ingreso requiere entrada confirmada y evento del día.')
      if (
        estado === 'CANCELADA' &&
        !isStaff(user) &&
        instant(evento.fecha, evento.horario) - Date.now() < 2 * 60 * 60 * 1000
      )
        throw new ConflictError('Cancelá la entrada con al menos 2 horas de anticipación.')
      const updated = Entradas.update(id, {
        estado,
        ...(estado === 'CONFIRMADA' ? { pagada: new Date().toISOString() } : {}),
      })
      avisar(
        item.cliente,
        `Tu entrada #${id} para ${evento.nombre} cambió a ${estado.toLowerCase()}.`,
      )
      return updated
    })
  },
}
