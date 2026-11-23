export const reservaTransitions = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['ACTIVA', 'CANCELADA'],
  ACTIVA: ['FINALIZADA'],
  FINALIZADA: [],
  CANCELADA: [],
}
export const eventoTransitions = {
  BORRADOR: ['PUBLICADO'],
  PUBLICADO: ['BORRADOR', 'ACTIVO', 'CANCELADO'],
  ACTIVO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
}
export const puedeCancelar = (reserva) =>
  reserva.puedeCancelar ??
  (['PENDIENTE', 'CONFIRMADA'].includes(reserva.estado) &&
    new Date(`${reserva.fecha}T${reserva.horario}:00-03:00`).getTime() - Date.now() >=
      2 * 60 * 60 * 1000)
export function validarPerfil(values) {
  const errors = {}
  const birth = values.fechaNacimiento
  const now = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const parsed = new Date(`${birth}T12:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(birth || '') ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== birth ||
    birth > now
  )
    errors.fechaNacimiento = 'Ingresá una fecha de nacimiento válida.'
  else {
    const edad =
      Number(now.slice(0, 4)) - Number(birth.slice(0, 4)) - (now.slice(5) < birth.slice(5) ? 1 : 0)
    if (edad < 16 || edad > 120) errors.fechaNacimiento = 'Debés tener entre 16 y 120 años.'
  }
  if (!/^\d{8,15}$/.test(values.telefono || ''))
    errors.telefono = 'Usá entre 8 y 15 dígitos, sin espacios ni signos.'
  return errors
}
