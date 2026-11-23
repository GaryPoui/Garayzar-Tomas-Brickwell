import { Router } from 'express'
import CatalogoController from '../controllers/CatalogoController.js'
import { optionalAuth } from '../middlewares/auth.js'
const router = Router()
router.get('/', optionalAuth, CatalogoController.obtener)
export default router
