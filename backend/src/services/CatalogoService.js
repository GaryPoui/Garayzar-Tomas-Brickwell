import CatalogoRepository from '../repositories/CatalogoRepository.js'
import Reservas from '../repositories/ReservaRepository.js'
import { BadRequestError, ConflictError } from '../exceptions/AppError.js'
import { date, number } from '../utils/validation.js'
export const validarFechaCatalogo = (fecha) => date(fecha)
export const mesaOcupada = (mesa, fecha, excluir) =>
  Reservas.findAll().some(
    (reserva) =>
      reserva.id !== Number(excluir) &&
      reserva.fecha === fecha &&
      reserva.mesa === mesa &&
      ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(reserva.estado),
  )
export function prepararMesa(datos, excluir) {
  number(datos.mesa, 'Mesa', 1, 1000000, true)
  const catalogo = CatalogoRepository.obtener()
  const mesa = catalogo.mesas.find((item) => item.id === datos.mesa)
  const sector = mesa && catalogo.sectores.find((item) => item.id === mesa.sector)
  if (!mesa || !sector?.disponible)
    throw new BadRequestError('Seleccioná una mesa de un sector habilitado.')
  const personas = number(datos.personas, 'Personas', 1, mesa.capacidad, true)
  const seleccion = datos.combos ?? []
  if (!Array.isArray(seleccion) || seleccion.length > catalogo.paquetes.length)
    throw new BadRequestError('Seleccioná combos válidos.')
  const ids = new Set()
  const combos = seleccion.map((item) => {
    number(item?.id, 'Combo', 1, 1000000, true)
    const paquete = catalogo.paquetes.find(
      (entry) => entry.id === item.id && entry.precio > 0 && entry.activo,
    )
    if (!paquete || ids.has(item.id))
      throw new BadRequestError('Seleccioná combos activos y sin duplicados.')
    const cantidad = number(item.cantidad, 'Cantidad del combo', 1, 10, true)
    ids.add(item.id)
    return {
      id: paquete.id,
      nombre: paquete.nombre,
      cantidad,
      precioUnitario: paquete.precio,
      subtotal: paquete.precio * cantidad,
    }
  })
  if (
    ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(datos.estado || 'PENDIENTE') &&
    mesaOcupada(mesa.id, datos.fecha, excluir)
  )
    throw new ConflictError(
      'Esa mesa ya está reservada para la fecha elegida. Seleccioná otra mesa.',
    )
  return {
    mesa: mesa.id,
    personas,
    sector: sector.id,
    paquete: combos[0]?.id || 1,
    combos,
    detalleMesa: {
      ...mesa,
      sectorNombre: sector.nombre,
      tipo: sector.tipo,
      cercania: sector.cercania,
    },
    precioBase: mesa.precio + combos.reduce((total, item) => total + item.subtotal, 0),
  }
}
export default {
  obtener(fecha, excluir, user) {
    const catalogo = CatalogoRepository.obtener()
    if (fecha !== undefined) date(fecha)
    if (
      excluir !== undefined &&
      (!user || !['ADMIN', 'RECEPCIONISTA'].includes(user.rol) || !Reservas.findById(excluir))
    )
      throw new BadRequestError(
        'La exclusión de una reserva solo está disponible para el personal al editar.',
      )
    return {
      ...catalogo,
      sectores: catalogo.sectores.filter((item) => item.disponible),
      paquetes: catalogo.paquetes.filter((item) => item.activo),
      fecha: fecha || null,
      mesas: catalogo.mesas
        .filter((item) =>
          catalogo.sectores.some((sector) => sector.id === item.sector && sector.disponible),
        )
        .map((mesa) => ({
          ...mesa,
          disponible: fecha ? !mesaOcupada(mesa.id, fecha, excluir) : null,
        })),
    }
  },
}
