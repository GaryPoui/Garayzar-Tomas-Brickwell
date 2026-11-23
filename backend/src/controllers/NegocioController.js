import Usuarios from '../services/UsuarioService.js'
import Eventos from '../services/EventoService.js'
import Entradas from '../services/EntradaService.js'
import Catalogo from '../services/GestionCatalogoService.js'
import Carta from '../services/CartaService.js'
import Avisos from '../services/NotificacionService.js'
import Reportes from '../services/ReporteService.js'
import Configuracion from '../services/ConfiguracionService.js'
import { handler } from './handler.js'
export default {
  configuracion: handler(() => Configuracion.obtener()),
  guardarConfiguracion: handler((req) => Configuracion.guardar(req.body)),
  carta: handler(() => Carta.listar()),
  eventos: handler(() => Eventos.listar()),
  evento: handler((req) => Eventos.obtener(req.params.id)),
  comprar: handler((req) => Entradas.comprar(req.params.id, req.user), 201),
  entradas: handler((req) => Entradas.listar(req.user)),
  entrada: handler((req) => Entradas.modificar(req.params.id, req.body, req.user)),
  usuarios: handler(() => Usuarios.listar()),
  clientes: handler(() => Usuarios.clientes()),
  crearUsuario: handler((req) => Usuarios.crear(req.body), 201),
  modificarUsuario: handler((req) => Usuarios.modificar(req.params.id, req.body, req.user)),
  perfil: handler((req) => Usuarios.modificar(req.user.id, req.body, req.user, true)),
  historial: handler((req) => Usuarios.historial(req.user.id)),
  historialCliente: handler((req) => Usuarios.historial(req.params.id, true)),
  avisos: handler((req) => Avisos.listar(req.user)),
  leerAviso: handler((req) => Avisos.leer(req.params.id, req.user)),
  gestionEventos: handler(() => Eventos.listar(false)),
  crearEvento: handler((req) => Eventos.guardar(null, req.body), 201),
  editarEvento: handler((req) => Eventos.guardar(req.params.id, req.body)),
  eliminarEvento: handler((req) => Eventos.eliminar(req.params.id)),
  catalogo: handler((req) => Catalogo.listar(req.params.tipo)),
  crearCatalogo: handler((req) => Catalogo.guardar(req.params.tipo, null, req.body, req.user), 201),
  editarCatalogo: handler((req) =>
    Catalogo.guardar(req.params.tipo, req.params.id, req.body, req.user),
  ),
  eliminarCatalogo: handler((req) => Catalogo.eliminar(req.params.tipo, req.params.id)),
  reportes: handler(() => Reportes.obtener()),
}
