import Eventos from '../repositories/EventoRepository.js'
import Entradas from '../repositories/EntradaRepository.js'
import { avisar } from './NotificacionService.js'
import { object, text, date, time, number, today, instant } from '../utils/validation.js'
import { transaction } from '../database.js'
import { BadRequestError, ConflictError, NotFoundError } from '../exceptions/AppError.js'
import Evento from '../models/Evento.js'
import Flyer from '../models/Flyer.js'
export const eventTransitions = {
  BORRADOR: ['PUBLICADO'],
  PUBLICADO: ['BORRADOR', 'ACTIVO', 'CANCELADO'],
  ACTIVO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
}
const sold = async (id) =>
  (await Entradas.findAll()).filter((item) => item.evento === id && item.estado !== 'CANCELADA')
    .length
export async function detalleEvento(evento) {
  const entradasVendidas = await sold(evento.id)
  return {
    ...evento,
    entradasDisponibles: Math.max(0, evento.capacidadMaxima - entradasVendidas),
    entradasVendidas,
  }
}
function optional(value, label, max = 500) {
  return text(value ?? '', label, 0, max)
}
function image(value) {
  const url = optional(value, 'URL de imagen', 2000)
  if (url && (!url.startsWith('https://') || !URL.canParse(url)))
    throw new BadRequestError('Las imágenes deben usar una URL HTTPS válida.')
  return url
}
export default {
  async listar(publico = true) {
    return Promise.all(
      (await Eventos.findAll())
        .filter((item) => !publico || ['PUBLICADO', 'ACTIVO'].includes(item.estado))
        .map(detalleEvento),
    )
  },
  async obtener(id, publico = true) {
    const item = await Eventos.findById(id)
    if (!item || (publico && !['PUBLICADO', 'ACTIVO'].includes(item.estado)))
      throw new NotFoundError('El evento no existe o no está publicado.')
    return await detalleEvento(item)
  },
  async guardar(id, datos) {
    return transaction(async () => {
      object(datos)
      const original = id ? await this.obtener(id, false) : null
      if (original && !eventTransitions[original.estado].length)
        throw new ConflictError('Un evento finalizado o cancelado no se puede modificar.')
      const data = { ...original, ...datos }
      const estado = datos.estado ?? original?.estado ?? 'BORRADOR'
      if (!Object.hasOwn(eventTransitions, estado) || (!original && estado !== 'BORRADOR'))
        throw new BadRequestError('Creá primero el evento como borrador.')
      if (
        original &&
        estado !== original.estado &&
        !eventTransitions[original.estado].includes(estado)
      )
        throw new ConflictError('La transición del evento no está permitida.')
      const nombre = text(data.nombre, 'Nombre del evento', 2, 100)
      date(data.fecha)
      time(data.horario)
      if (
        (!original ||
          data.fecha !== original.fecha ||
          data.horario !== original.horario ||
          (estado === 'PUBLICADO' && original.estado !== 'PUBLICADO')) &&
        instant(data.fecha, data.horario) <= Date.now()
      )
        throw new BadRequestError('El evento debe comenzar en el futuro.')
      const capacidadMaxima = number(data.capacidadMaxima, 'Capacidad máxima', 1, 100000, true)
      const count = original ? await sold(original.id) : 0
      if (count > capacidadMaxima)
        throw new ConflictError('La capacidad no puede ser menor que las entradas ya emitidas.')
      if (
        count &&
        (data.fecha !== original.fecha ||
          data.horario !== original.horario ||
          estado === 'BORRADOR')
      )
        throw new ConflictError('No podés ocultar ni reprogramar un evento con entradas emitidas.')
      if (estado === 'ACTIVO' && data.fecha !== today())
        throw new ConflictError('El evento solo se puede activar el día programado.')
      const flyer = {
        dj: optional(data.dj, 'DJ'),
        generoMusical: optional(data.generoMusical, 'Género musical'),
        dressCode: optional(data.dressCode, 'Dress code'),
        promociones: optional(data.promociones, 'Promociones'),
        presenciasEspeciales: optional(data.presenciasEspeciales, 'Presencias especiales'),
        imagen: image(data.imagen),
        fotoDj: image(data.fotoDj),
      }
      const descripcion = optional(data.descripcion, 'Descripción', 2000)
      if (![descripcion, flyer.dj, flyer.dressCode, flyer.promociones].some(Boolean))
        throw new BadRequestError('Completá al menos descripción, DJ, dress code o promoción.')
      const record = {
        nombre,
        fecha: data.fecha,
        horario: data.horario,
        descripcion,
        estado,
        capacidadMaxima,
        precioEntrada: number(data.precioEntrada, 'Precio anticipado'),
        precioPuerta: number(data.precioPuerta, 'Precio en puerta'),
        ...flyer,
      }
      const visual = new Flyer(
        null,
        flyer.imagen,
        flyer.dj,
        flyer.fotoDj,
        flyer.generoMusical,
        flyer.presenciasEspeciales,
        flyer.dressCode,
        flyer.promociones,
      )
      const saved = original
        ? await Eventos.update(id, { ...record, flyer: visual })
        : await Eventos.create(
            Object.assign(
              new Evento(
                null,
                nombre,
                data.fecha,
                descripcion,
                record.precioEntrada,
                capacidadMaxima,
                capacidadMaxima,
                estado,
                visual,
              ),
              record,
            ),
          )
      if (estado === 'CANCELADO')
        for (const entrada of (await Entradas.findAll()).filter(
          (item) => item.evento === saved.id && item.estado !== 'CANCELADA',
        )) {
          await Entradas.update(entrada.id, { estado: 'CANCELADA' })
          await avisar(
            entrada.cliente,
            `Se canceló ${saved.nombre}. Tu entrada #${entrada.id} quedó cancelada. Si abonaste, contactá al local por el reembolso.`,
          )
        }
      return await detalleEvento(saved)
    })
  },
  async eliminar(id) {
    return transaction(async () => {
      const item = await this.obtener(id, false)
      if ((await Entradas.findAll()).some((entrada) => entrada.evento === item.id))
        throw new ConflictError(
          'El evento tiene entradas en el historial. Conservá el registro y cancelalo si corresponde.',
        )
      if (!['BORRADOR', 'CANCELADO'].includes(item.estado))
        throw new ConflictError('Solo se pueden eliminar borradores o eventos cancelados.')
      return await Eventos.delete(id)
    })
  },
}
