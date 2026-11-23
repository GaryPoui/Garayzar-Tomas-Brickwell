import Reservas from '../repositories/ReservaRepository.js'
import Entradas from '../repositories/EntradaRepository.js'
import Usuarios from '../repositories/UsuarioRepository.js'
export default {
  obtener() {
    const reservas = Reservas.findAll()
    const entradas = Entradas.findAll()
    const vigentes = reservas.filter((item) => item.estado !== 'CANCELADA')
    return {
      reservas: reservas.length,
      anticipos: vigentes.reduce((total, item) => total + item.anticipo, 0),
      ventasEntradas: entradas
        .filter((item) => ['CONFIRMADA', 'USADA'].includes(item.estado))
        .reduce((total, item) => total + item.precio, 0),
      pendientesReservas: vigentes.reduce(
        (total, item) => total + item.precioTotal - item.anticipo,
        0,
      ),
      clientes: Usuarios.findAll()
        .filter((user) => user.rol === 'CLIENTE')
        .map((user) => ({
          id: user.id,
          nombre: user.nombre,
          reservas: reservas.filter((item) => item.cliente === user.id).length,
          visitas: reservas.filter(
            (item) => item.cliente === user.id && item.estado === 'FINALIZADA',
          ).length,
          eventosAsistidos: entradas.filter(
            (item) => item.cliente === user.id && item.estado === 'USADA',
          ).length,
        })),
    }
  },
}
