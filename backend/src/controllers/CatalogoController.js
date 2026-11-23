import CatalogoService from '../services/CatalogoService.js'
import { handler } from './handler.js'
export default {
  obtener: handler((req) => CatalogoService.obtener(req.query.fecha, req.query.excluir, req.user)),
}
