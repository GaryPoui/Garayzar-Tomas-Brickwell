import { Router } from 'express'
import AuthController from '../controllers/AuthController.js'
import { requireAuth, limitAuth } from '../middlewares/auth.js'
const router = Router()
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
router.post('/registro', limitAuth, AuthController.register)
router.post('/login', limitAuth, AuthController.login)
router.get('/sesion', requireAuth, AuthController.session)
router.post('/logout', requireAuth, AuthController.logout)
export default router
