import { register, login, logout } from '../services/AuthService.js'
import { handler } from './handler.js'
export default {
  register: handler((req) => register(req.body), 201),
  login: handler((req) => login(req.body)),
  session: handler((req) => req.user),
  logout: handler(async (req) => {
    await logout(req.sessionId)
    return null
  }),
}
