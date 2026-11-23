import { BadRequestError } from '../exceptions/AppError.js'
export function object(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new BadRequestError('Enviá un objeto con los datos requeridos.')
  return data
}
export function text(value, label, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new BadRequestError(`${label}: ingresá entre ${min} y ${max} caracteres.`)
  return value.trim()
}
export function number(value, label, min = 0, max = 100000000, integer = false) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isSafeInteger(value))
  )
    throw new BadRequestError(
      `${label}: ingresá ${integer ? 'un entero' : 'un número'} entre ${min} y ${max}.`,
    )
  return value
}
export function date(value, label = 'Fecha') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestError(`${label}: ingresá una fecha válida.`)
  const parsed = new Date(`${value}T12:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new BadRequestError(`${label}: ingresá una fecha real.`)
  return value
}
export const today = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
export function age(birth, now = today()) {
  date(birth, 'Fecha de nacimiento')
  const years =
    Number(now.slice(0, 4)) - Number(birth.slice(0, 4)) - (now.slice(5) < birth.slice(5) ? 1 : 0)
  if (birth > now || years > 120)
    throw new BadRequestError('Ingresá una fecha de nacimiento válida, de hasta 120 años.')
  if (years < 16)
    throw new BadRequestError("Debes tener al menos 16 años para registrarte en Brickell's.")
  return years
}
export function phone(value) {
  if (typeof value !== 'string' || !/^\d{8,15}$/.test(value))
    throw new BadRequestError('El teléfono debe contener entre 8 y 15 dígitos.')
  return value
}
export function time(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new BadRequestError('Ingresá un horario válido.')
  return value
}
export const instant = (fecha, horario) => new Date(`${fecha}T${horario}:00-03:00`).getTime()
export function boolean(value, label) {
  if (typeof value !== 'boolean') throw new BadRequestError(`${label}: debe ser verdadero o falso.`)
  return value
}
