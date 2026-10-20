export const ESTADOS = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  ACTIVA: 'Activa',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export function fechaLocal(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fechaMinima() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return fechaLocal(date)
}

export const moneda = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

export const fechaLegible = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))

export const referencia = (value) =>
  typeof value === 'object' && value !== null ? value.nombre || `#${value.id}` : `#${value}`

export function valoresIniciales(reserva) {
  return {
    fecha: reserva?.fecha || '',
    horario: reserva?.horario || '',
    cliente: reserva?.cliente?.id ?? reserva?.cliente ?? '',
    sector: reserva?.sector?.id ?? reserva?.sector ?? '',
    paquete: reserva?.paquete?.id ?? reserva?.paquete ?? '',
    precioTotal: reserva?.precioTotal ?? '',
    anticipo: reserva?.anticipo ?? '',
    estado: reserva?.estado || 'PENDIENTE',
  }
}

export function validarReserva(values, original) {
  const errors = {}
  const parsed = new Date(`${values.fecha}T12:00:00`)
  if (!values.fecha) errors.fecha = 'Ingresá la fecha de la reserva.'
  else if (Number.isNaN(parsed.getTime()) || fechaLocal(parsed) !== values.fecha) {
    errors.fecha = 'Ingresá una fecha válida.'
  } else if (values.fecha !== original?.fecha && values.fecha < fechaMinima()) {
    errors.fecha = 'La fecha debe ser a partir de mañana.'
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.horario)) {
    errors.horario = 'Ingresá un horario válido.'
  }
  for (const field of ['cliente', 'sector', 'paquete']) {
    if (!Number.isSafeInteger(Number(values[field])) || Number(values[field]) <= 0) {
      errors[field] = 'Ingresá un ID entero mayor que cero.'
    }
  }
  for (const field of ['precioTotal', 'anticipo']) {
    if (
      String(values[field]).trim() === '' ||
      !Number.isFinite(Number(values[field])) ||
      Number(values[field]) < 0
    ) {
      errors[field] = 'Ingresá un importe igual o mayor que cero.'
    }
  }
  if (
    !errors.anticipo &&
    !errors.precioTotal &&
    Number(values.anticipo) > Number(values.precioTotal)
  ) {
    errors.anticipo = 'El anticipo no puede superar el precio total.'
  }
  if (!Object.hasOwn(ESTADOS, values.estado)) errors.estado = 'Seleccioná un estado válido.'
  return errors
}

export function prepararReserva(values, original) {
  const datos = { ...values }
  for (const field of ['cliente', 'sector', 'paquete', 'precioTotal', 'anticipo']) {
    datos[field] = Number(datos[field])
  }
  if (!original) delete datos.estado
  if (original?.fecha === datos.fecha) delete datos.fecha
  return datos
}

export function filtrarReservas(reservas, { search = '', estado = '', fecha = '' } = {}) {
  const query = search.trim().toLocaleLowerCase('es-AR')
  return reservas
    .filter((reserva) => {
      const text = [
        reserva.id,
        referencia(reserva.cliente),
        referencia(reserva.sector),
        referencia(reserva.paquete),
      ]
        .join(' ')
        .toLocaleLowerCase('es-AR')
      return (
        (!query || text.includes(query)) &&
        (!estado || reserva.estado === estado) &&
        (!fecha || reserva.fecha === fecha)
      )
    })
    .toSorted(
      (first, second) =>
        `${first.fecha} ${first.horario}`.localeCompare(`${second.fecha} ${second.horario}`) ||
        second.id - first.id,
    )
}
