import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import Usuarios from '../repositories/UsuarioRepository.js'
import Sesiones from '../repositories/SesionRepository.js'
import { transaction } from '../database.js'
import AppError, { BadRequestError, ConflictError } from '../exceptions/AppError.js'
import { object, text, age, phone } from '../utils/validation.js'
import { publicUser } from '../utils/roles.js'
import Cliente from '../models/Cliente.js'
import Empleado from '../models/Empleado.js'
import Administrador from '../models/Administrador.js'
const models = { CLIENTE: Cliente, RECEPCIONISTA: Empleado, ADMIN: Administrador }
const deriveKey = promisify(scrypt)
const digest = (token) => createHash('sha256').update(token).digest('hex')
function credentials(data) {
  object(data)
  const email = text(data.email, 'Email', 3, 254).toLowerCase()
  text(data.password, 'Contraseña', 1, 128)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BadRequestError('Ingresá un email válido.')
  return { email, password: data.password }
}
export async function createUser(data, rol = 'CLIENTE', bootstrap = false) {
  const { email, password } = credentials(data)
  const nombre = text(data.nombre, 'Nombre', 2, 80)
  if (
    password.length < 10 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  )
    throw new BadRequestError(
      'La contraseña debe tener de 10 a 128 caracteres, mayúscula, minúscula y número.',
    )
  if (!bootstrap) {
    age(data.fechaNacimiento)
    phone(data.telefono)
  }
  if (Usuarios.findByEmail(email)) throw new ConflictError('Ya existe una cuenta con ese email.')
  const salt = randomBytes(16).toString('hex')
  const hash = (await deriveKey(password, salt, 64)).toString('hex')
  return transaction(() => {
    if (Usuarios.findByEmail(email)) throw new ConflictError('Ya existe una cuenta con ese email.')
    return Usuarios.create(
      new models[rol]({
        nombre,
        email,
        salt,
        hash,
        fechaNacimiento: data.fechaNacimiento || null,
        telefono: data.telefono || '',
        activo: true,
      }),
    )
  })
}
function startSession(user) {
  const token = randomBytes(32).toString('hex')
  transaction(() => {
    for (const session of Sesiones.findAll())
      if (session.expires <= Date.now()) Sesiones.delete(session.id)
    Sesiones.create({
      key: digest(token),
      usuario: user.id,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  })
  return { user: publicUser(user), token }
}
export const register = async (data) => startSession(await createUser(data))
export async function login(data) {
  const { email, password } = credentials(data)
  const user = Usuarios.findByEmail(email)
  const hash = await deriveKey(password, user?.salt || 'brickwell-unknown-user', 64)
  if (!user?.activo || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex')))
    throw new AppError('Email o contraseña incorrectos.', 401)
  return startSession(user)
}
export function authenticate(token) {
  const session =
    typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
      ? Sesiones.findByKey(digest(token))
      : null
  const user = session && Usuarios.findById(session.usuario)
  if (!session || session.expires <= Date.now() || !user?.activo) {
    if (session) Sesiones.delete(session.id)
    throw new AppError('Iniciá sesión para continuar.', 401)
  }
  return { user: publicUser(user), sessionId: session.id }
}
export const logout = (id) => Sesiones.delete(id)
for (const [prefix, rol, nombre] of [
  ['ADMIN', 'ADMIN', 'Administración'],
  ['RECEPCION', 'RECEPCIONISTA', 'Recepción'],
]) {
  const email = process.env[`${prefix}_EMAIL`]
  const password = process.env[`${prefix}_PASSWORD`]
  if (Boolean(email) !== Boolean(password))
    throw new Error(`Configurá ${prefix}_EMAIL y ${prefix}_PASSWORD juntos.`)
  if (email && !Usuarios.findByEmail(email.trim().toLowerCase()))
    await createUser({ email, password, nombre }, rol, true)
}
