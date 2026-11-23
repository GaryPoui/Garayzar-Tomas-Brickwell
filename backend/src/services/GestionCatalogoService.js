import { sectores, mesas, paquetes } from '../repositories/CatalogoRepository.js'
import Carta from '../repositories/CartaRepository.js'
import Reservas from '../repositories/ReservaRepository.js'
import { object, text, number, boolean, today } from '../utils/validation.js'
import { isAdmin } from '../utils/roles.js'
import { transaction } from '../database.js'
import AppError, { ConflictError, NotFoundError } from '../exceptions/AppError.js'
const repositories = { sectores, paquetes, carta: Carta }
const vigente = (item) =>
  item.fecha >= today() && ['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(item.estado)
function repository(tipo) {
  if (!repositories[tipo]) throw new NotFoundError('El catálogo no existe.')
  return repositories[tipo]
}
function validar(tipo, data) {
  if (tipo === 'sectores')
    return {
      nombre: text(data.nombre, 'Nombre', 2, 80),
      tipo: text(data.tipo, 'Tipo de mesa', 2, 80),
      cercania: text(data.cercania, 'Ubicación', 2, 80),
      descripcion: text(data.descripcion, 'Descripción', 2, 500),
      precio: number(data.precio, 'Precio'),
      personasPorMesa: number(data.personasPorMesa, 'Personas por mesa', 1, 20, true),
      disponible: boolean(data.disponible, 'Disponible'),
    }
  if (tipo === 'paquetes')
    return {
      nombre: text(data.nombre, 'Nombre', 2, 80),
      descripcion: text(data.descripcion, 'Descripción', 2, 500),
      precio: number(data.precio, 'Precio'),
      activo: boolean(data.activo, 'Activo'),
      imagen: ['bar', 'whisky', 'citrus'].includes(data.imagen) ? data.imagen : 'bar',
    }
  return {
    name: text(data.name, 'Nombre', 2, 80),
    category: text(data.category, 'Categoría', 2, 80),
    price: number(data.price, 'Precio'),
    description: text(data.description, 'Descripción', 2, 1000),
    ingredients: text(data.ingredients, 'Ingredientes', 2, 500),
    character: text(data.character ?? '', 'Presentación', 0, 200),
    image: ['bar', 'whisky', 'citrus'].includes(data.image) ? data.image : 'bar',
    alt: 'Imagen de ambientación de coctelería',
    disponible: boolean(data.disponible, 'Disponible'),
  }
}
export default {
  async listar(tipo) {
    return repository(tipo).findAll()
  },
  async guardar(tipo, id, datos, user) {
    return transaction(async () => {
      object(datos)
      const repo = repository(tipo)
      const current = id ? await repo.findById(id) : null
      if (id && !current) throw new NotFoundError('El registro no existe.')
      if (!isAdmin(user)) {
        if (tipo !== 'carta' || !id || Object.keys(datos).some((key) => key !== 'disponible'))
          throw new AppError('Solo administración puede modificar el catálogo.', 403)
        return await repo.update(id, {
          disponible: boolean(datos.disponible, 'Disponible'),
        })
      }
      const data = validar(tipo, { ...current, ...datos })
      if (tipo === 'paquetes' && current?.id === 1 && (data.precio !== 0 || !data.activo))
        throw new ConflictError('Solo mesa debe conservarse activo y sin precio de consumición.')
      if (
        (await repo.findAll()).some(
          (item) =>
            item.id !== current?.id &&
            (item.nombre || item.name).toLocaleLowerCase() ===
              (data.nombre || data.name).toLocaleLowerCase(),
        )
      )
        throw new ConflictError('Ya existe un registro con ese nombre.')
      if (tipo === 'sectores' && current) {
        const active = (await Reservas.findAll()).filter(
          (item) => item.sector === current.id && vigente(item),
        )
        if (
          (!data.disponible && active.length) ||
          active.some((item) => item.personas > data.personasPorMesa)
        )
          throw new ConflictError(
            'El sector tiene reservas vigentes que impiden reducir su capacidad o deshabilitarlo.',
          )
      }
      if (
        tipo === 'paquetes' &&
        !data.activo &&
        (await Reservas.findAll()).some(
          (item) => vigente(item) && item.combos?.some((combo) => combo.id === current?.id),
        )
      )
        throw new ConflictError('El combo está incluido en reservas vigentes.')
      const saved = id ? await repo.update(id, data) : await repo.create(data)
      if (tipo === 'sectores') {
        const existing = (await mesas.findAll()).filter((item) => item.sector === saved.id)
        if (existing.length)
          for (const mesa of existing)
            await mesas.update(mesa.id, {
              precio: data.precio,
              capacidad: data.personasPorMesa,
            })
        else
          for (let columna = 1; columna <= 4; columna++)
            await mesas.create({
              nombre: `S${saved.id}-${columna}`,
              sector: saved.id,
              precio: data.precio,
              capacidad: data.personasPorMesa,
              fila: saved.id,
              columna: columna - 1,
            })
        return await repo.update(saved.id, {
          capacidad: data.personasPorMesa * 4,
          fila: current?.fila || saved.id,
        })
      }
      return saved
    })
  },
  async eliminar(tipo, id) {
    return transaction(async () => {
      const repo = repository(tipo)
      const item = await repo.findById(id)
      if (!item) throw new NotFoundError('El registro no existe.')
      if (tipo === 'paquetes' && Number(id) === 1)
        throw new ConflictError('El paquete Solo mesa es parte del sistema.')
      if (
        tipo === 'sectores' &&
        (await Reservas.findAll()).some((reserva) => reserva.sector === item.id)
      )
        throw new ConflictError(
          'El sector tiene historial de reservas. Deshabilitalo cuando no tenga reservas vigentes.',
        )
      if (
        tipo === 'paquetes' &&
        (await Reservas.findAll()).some((reserva) =>
          reserva.combos?.some((combo) => combo.id === item.id),
        )
      )
        throw new ConflictError(
          'El combo tiene historial de reservas. Desactivalo cuando no tenga reservas vigentes.',
        )
      if (tipo === 'sectores')
        for (const mesa of (await mesas.findAll()).filter((mesa) => mesa.sector === item.id))
          await mesas.delete(mesa.id)
      return await repo.delete(id)
    })
  },
}
