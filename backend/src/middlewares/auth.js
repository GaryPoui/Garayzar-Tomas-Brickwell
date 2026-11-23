import { authenticate } from '../services/AuthService.js'
import AppError from '../exceptions/AppError.js'
import { isStaff, isAdmin } from '../utils/roles.js'
export async function requireAuth(req, res, next) {
  try {
    const { user, sessionId } = await authenticate(
      req.headers.authorization?.match(/^Bearer (.+)$/)?.[1],
    )
    req.user = user
    req.sessionId = sessionId
    res.set('Cache-Control', 'no-store')
    next()
  } catch (error) {
    next(error)
  }
}
export function optionalAuth(req, res, next) {
  return req.headers.authorization ? requireAuth(req, res, next) : next()
}
export function requireStaff(req, res, next) {
  return isStaff(req.user)
    ? next()
    : next(new AppError('Esta acción requiere permisos de administración o recepción.', 403))
}
export function requireAdmin(req, res, next) {
  return isAdmin(req.user)
    ? next()
    : next(new AppError('Esta acción requiere permisos de administración.', 403))
}
const attempts = new Map()
export function limitAuth(req, res, next) {
  const now = Date.now()
  for (const [key, attempt] of attempts) if (attempt.expires <= now) attempts.delete(key)
  const attempt = attempts.get(req.ip) || {
    count: 0,
    expires: now + 15 * 60 * 1000,
  }
  attempts.set(req.ip, attempt)
  if (++attempt.count > (process.env.NODE_ENV === 'test' ? 500 : 30))
    return next(new AppError('Demasiados intentos. Probá de nuevo en 15 minutos.', 429))
  next()
}
