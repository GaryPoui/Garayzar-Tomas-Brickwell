import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fechaLocal,
  fechaMinima,
  validarReserva,
  prepararReserva,
  filtrarReservas,
  valoresIniciales,
} from './reservas.js'

const valid = () => ({
  fecha: fechaMinima(),
  horario: '23:30',
  cliente: '1',
  sector: '2',
  paquete: '1',
  precioTotal: '50000',
  anticipo: '15000',
  estado: 'PENDIENTE',
})

test('acepta mañana y rechaza hoy, campos vacíos y fechas inexistentes', () => {
  assert.deepEqual(validarReserva(valid()), {})
  assert.ok(validarReserva({ ...valid(), fecha: fechaLocal() }).fecha)
  assert.ok(validarReserva({ ...valid(), fecha: '2099-02-31' }).fecha)
  assert.equal(Object.keys(validarReserva(valoresIniciales())).length, 7)
})

test('valida horario, IDs, estado e importes sin aceptar infinitos', () => {
  const errors = validarReserva({
    ...valid(),
    horario: '24:61',
    cliente: '-1',
    sector: '1.2',
    precioTotal: Infinity,
    anticipo: '-2',
    estado: 'OTRO',
  })
  assert.equal(Object.keys(errors).length, 6)
  assert.ok(validarReserva({ ...valid(), anticipo: '60000' }).anticipo)
  assert.deepEqual(validarReserva({ ...valid(), precioTotal: '0', anticipo: '0' }), {})
})

test('permite editar una reserva pasada sin reenviar su fecha ni forzar un estado al crear', () => {
  const original = { ...valid(), fecha: '2020-01-01' }
  assert.deepEqual(validarReserva(original, original), {})
  assert.equal(prepararReserva(original, original).fecha, undefined)
  assert.equal(prepararReserva(valid()).estado, undefined)
  assert.equal(prepararReserva(valid()).cliente, 1)
})

test('filtra por búsqueda, estado y fecha sin modificar el listado original', () => {
  const reservas = [
    { ...valid(), id: 7 },
    { ...valid(), id: 8, estado: 'CONFIRMADA' },
  ]
  assert.equal(
    filtrarReservas(reservas, { search: '#2', estado: 'CONFIRMADA', fecha: fechaMinima() })[0].id,
    8,
  )
  assert.equal(filtrarReservas(reservas, { search: 'inexistente' }).length, 0)
  assert.equal(reservas[0].id, 7)
})
