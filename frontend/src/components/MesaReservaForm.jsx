import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Armchair, CalendarDays, Minus, Plus, RefreshCw, Save, ShoppingBag } from 'lucide-react'
import { Button, Field, IconButton, LoadingState, StatusBadge } from './ui.jsx'
import VenueMap from './VenueMap.jsx'
import useCatalogo from '../utils/useCatalogo.js'
import { useAuth, useNotification, useReservas } from '../utils/applicationContext.js'
import { crearReserva, modificarReserva } from '../services/reservaService.js'
import { ESTADOS, fechaLegible, fechaMinima, moneda, validarReserva } from '../utils/reservas.js'
import barPhoto from '../assets/nightlife/club.jpg'
import whiskyPhoto from '../assets/nightlife/bar-cocktails.jpg'
import citrusPhoto from '../assets/nightlife/citrus.jpg'

const photos = { bar: barPhoto, whisky: whiskyPhoto, citrus: citrusPhoto }

export default function MesaReservaForm({ original }) {
  const { user, home } = useAuth()
  const [params] = useSearchParams()
  const [values, setValues] = useState(() => ({
    fecha: original?.fecha || fechaMinima(),
    horario: original?.horario || '23:30',
    personas: original?.personas || 2,
    mesa: original?.mesa || '',
    anticipo: original?.anticipo || 0,
    estado: original?.estado || 'PENDIENTE',
  }))
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries((original?.combos || []).map((item) => [item.id, item.cantidad])),
  )
  const [sectorId, setSectorId] = useState(String(original?.sector || params.get('sector') || ''))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const form = useRef(null)
  const notify = useNotification()
  const { refresh: refreshReservas } = useReservas()
  const navigate = useNavigate()
  const { catalogo, loading, error, refresh } = useCatalogo(values.fecha, original?.id)
  const mesa = catalogo?.mesas.find((item) => item.id === Number(values.mesa))
  const sector = catalogo?.sectores.find((item) => item.id === mesa?.sector)
  const combos = (catalogo?.paquetes || []).filter((item) => item.precio > 0 && item.activo)
  const combosTotal = combos.reduce(
    (total, item) => total + item.precio * (Number(quantities[item.id]) || 0),
    0,
  )
  const total = (mesa?.precio || 0) + combosTotal

  function change(event) {
    const { name, value } = event.target
    setValues((current) => ({
      ...current,
      [name]: value,
      ...(['fecha', 'personas'].includes(name) ? { mesa: '' } : {}),
    }))
    setErrors({})
  }
  function input(name) {
    return {
      id: name,
      name,
      value: values[name],
      onChange: change,
      error: errors[name],
      required: true,
    }
  }
  function selectMesa(next) {
    setValues((current) => ({ ...current, mesa: next.id }))
    setSectorId(String(next.sector))
    setErrors({})
  }
  function quantity(id, value) {
    setQuantities((current) => ({ ...current, [id]: value }))
    setErrors({})
  }
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const failures = validarReserva(
      { ...values, cliente: user.id, sector: mesa?.sector || 1, paquete: 1, precioTotal: total },
      original,
    )
    if (
      !mesa ||
      (['PENDIENTE', 'CONFIRMADA', 'ACTIVA'].includes(values.estado) && !mesa.disponible)
    )
      failures.mesa = 'Elegí una mesa disponible en el mapa.'
    if (
      !Number.isSafeInteger(Number(values.personas)) ||
      Number(values.personas) < 1 ||
      (mesa && Number(values.personas) > mesa.capacidad)
    )
      failures.personas = 'Ingresá una cantidad válida para la mesa.'
    if (
      combos.some(
        (item) =>
          !Number.isSafeInteger(Number(quantities[item.id] ?? 0)) ||
          Number(quantities[item.id] ?? 0) < 0 ||
          Number(quantities[item.id] ?? 0) > 10,
      )
    )
      failures.combos = 'La cantidad de cada combo debe ser un entero entre 0 y 10.'
    setErrors(failures)
    if (Object.keys(failures).length) {
      notify('Revisá los campos señalados antes de guardar la reserva.', 'error')
      const target =
        form.current.elements.namedItem(Object.keys(failures)[0]) ||
        form.current.querySelector('.venue-table:not(:disabled)')
      target?.focus()
      return
    }
    setBusy(true)
    try {
      const data = {
        ...values,
        personas: Number(values.personas),
        mesa: mesa.id,
        anticipo: Number(values.anticipo),
        combos: combos
          .filter((item) => Number(quantities[item.id]) > 0)
          .map((item) => ({ id: item.id, cantidad: Number(quantities[item.id]) })),
      }
      if (!original) delete data.estado
      if (original?.fecha === data.fecha) delete data.fecha
      const saved = original ? await modificarReserva(original.id, data) : await crearReserva(data)
      notify(`La reserva #${saved.id} se ${original ? 'actualizó' : 'creó'} correctamente.`)
      refreshReservas()
      navigate(home)
    } catch (failure) {
      notify(failure.message, 'error')
      if (failure.status === 409) {
        setValues((current) => ({ ...current, mesa: '' }))
        refresh()
      }
      setBusy(false)
    }
  }

  return (
    <form
      ref={form}
      onSubmit={submit}
      className="reservation-form table-booking"
      noValidate
      aria-busy={busy}
    >
      <div className="form-main">
        <fieldset disabled={busy}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              01
            </span>{' '}
            Tu noche
          </legend>
          <div className="form-grid">
            <Field
              {...input('fecha')}
              label="Fecha"
              type="date"
              min={
                original?.fecha && original.fecha < fechaMinima() ? original.fecha : fechaMinima()
              }
            />
            <Field {...input('horario')} label="Horario" type="time" />
            <Field {...input('personas')} label="Personas" type="number" min="1" max="6" step="1" />
          </div>
          {original && (
            <Field {...input('estado')} label="Estado">
              {Object.entries(ESTADOS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Field>
          )}
        </fieldset>
        <fieldset disabled={busy || loading || Boolean(error)}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              02
            </span>{' '}
            Sector y mesa
          </legend>
          {loading ? (
            <LoadingState label="Consultando mesas disponibles..." />
          ) : error ? (
            <p>{error}</p>
          ) : (
            <>
              <div className="sector-choices" role="radiogroup" aria-label="Tipo de reserva">
                {catalogo.sectores.map((item) => (
                  <label key={item.id} className={`sector-choice venue-zone-${item.id}`}>
                    <input
                      type="radio"
                      name="tipo-sector"
                      value={item.id}
                      checked={sectorId === String(item.id)}
                      onChange={() => {
                        setSectorId(String(item.id))
                        setValues((current) => ({ ...current, mesa: '' }))
                      }}
                    />
                    <span>
                      <strong>{item.tipo}</strong>
                      <small>
                        {item.cercania} · Hasta {item.personasPorMesa} personas
                      </small>
                      <b>{moneda(item.precio)}</b>
                    </span>
                  </label>
                ))}
              </div>
              {sectorId && (
                <div
                  className="available-tables"
                  role="group"
                  aria-label="Mesas del sector elegido"
                >
                  {catalogo.mesas
                    .filter((item) => String(item.sector) === sectorId)
                    .map((item) => (
                      <Button
                        key={item.id}
                        icon={Armchair}
                        variant={Number(values.mesa) === item.id ? 'primary' : 'secondary'}
                        disabled={!item.disponible || Number(values.personas) > item.capacidad}
                        onClick={() => selectMesa(item)}
                      >
                        Mesa {item.nombre}
                      </Button>
                    ))}
                </div>
              )}
              <VenueMap
                catalogo={catalogo}
                selected={values.mesa}
                personas={values.personas}
                onSelect={selectMesa}
                error={errors.mesa}
              />
              <p className="catalog-note">{catalogo.referencia}</p>
            </>
          )}
        </fieldset>
        {error && (
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>
            Reintentar catálogo
          </Button>
        )}
        <fieldset disabled={busy || loading || Boolean(error)}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              03
            </span>{' '}
            Combos anticipados
          </legend>
          <div className="combo-options">
            {combos.map((item) => (
              <article className="combo-option" key={item.id}>
                <img
                  src={photos[item.imagen]}
                  alt="Imagen de ambientación de coctelería"
                  width="100"
                  height="100"
                />
                <div>
                  <h3>{item.nombre}</h3>
                  <p>{item.descripcion}</p>
                  <strong>{moneda(item.precio)}</strong>
                </div>
                <div className="combo-quantity">
                  <IconButton
                    label={`Quitar ${item.nombre}`}
                    icon={Minus}
                    disabled={!Number(quantities[item.id])}
                    onClick={() => quantity(item.id, Math.max(0, Number(quantities[item.id]) - 1))}
                  />
                  <label className="sr-only" htmlFor={`combo-${item.id}`}>
                    Cantidad de {item.nombre}
                  </label>
                  <input
                    id={`combo-${item.id}`}
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={quantities[item.id] ?? 0}
                    onChange={(event) => quantity(item.id, event.target.value)}
                    aria-invalid={Boolean(errors.combos)}
                    aria-describedby={errors.combos ? 'combos-error' : undefined}
                  />
                  <IconButton
                    label={`Agregar ${item.nombre}`}
                    icon={Plus}
                    disabled={Number(quantities[item.id]) >= 10}
                    onClick={() =>
                      quantity(item.id, Math.min(10, (Number(quantities[item.id]) || 0) + 1))
                    }
                  />
                </div>
              </article>
            ))}
          </div>
          {errors.combos && (
            <p id="combos-error" className="field-error">
              {errors.combos}
            </p>
          )}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              04
            </span>{' '}
            Importe de la reserva
          </legend>
          <div className="form-grid">
            <Field id="precioTotal" label="Precio total (ARS)" value={moneda(total)} readOnly />
            <Field
              {...input('anticipo')}
              label="Anticipo registrado (ARS)"
              type="number"
              min="0"
              step="0.01"
              hint="Solo importes ya recibidos por el local. No se cobra en línea."
            />
          </div>
        </fieldset>
      </div>
      <aside className="form-summary" aria-label="Resumen de la reserva">
        <div className="summary-visual">
          <img src={barPhoto} alt="Imagen de ambientación de la barra" width="1200" height="840" />
        </div>
        <div className="summary-title">
          <h2>Tu reserva</h2>
        </div>
        <StatusBadge estado={values.estado} />
        <div className="summary-date">
          <CalendarDays size={23} aria-hidden="true" />
          <div>
            <strong>{values.fecha ? fechaLegible(values.fecha) : 'Fecha por definir'}</strong>
            <span>
              {values.horario} h · {values.personas} personas
            </span>
          </div>
        </div>
        <dl className="summary-references">
          <div>
            <dt>Cliente</dt>
            <dd>
              {original && original.cliente !== user.id
                ? `Cliente #${original.cliente}`
                : user.nombre}
            </dd>
          </div>
          <div>
            <dt>Sector</dt>
            <dd>{sector?.nombre || 'Sin elegir'}</dd>
          </div>
          <div>
            <dt>Mesa</dt>
            <dd>{mesa ? `${mesa.nombre} · ${sector.cercania}` : 'Sin elegir'}</dd>
          </div>
        </dl>
        <div className="booking-combos">
          <h3>
            <ShoppingBag size={16} aria-hidden="true" />
            Consumición anticipada
          </h3>
          {combos
            .filter((item) => Number(quantities[item.id]) > 0)
            .map((item) => (
              <p key={item.id}>
                <span>
                  {quantities[item.id]} × {item.nombre}
                </span>
                <strong>{moneda(item.precio * Number(quantities[item.id]))}</strong>
              </p>
            ))}
          {!combosTotal && <p>Sin combos agregados</p>}
        </div>
        <dl className="summary-amounts">
          <div>
            <dt>Mesa</dt>
            <dd>{moneda(mesa?.precio)}</dd>
          </div>
          <div>
            <dt>Combos</dt>
            <dd>{moneda(combosTotal)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{moneda(total)}</dd>
          </div>
          <div>
            <dt>Anticipo registrado</dt>
            <dd>{moneda(values.anticipo)}</dd>
          </div>
          <div className="summary-balance">
            <dt>Saldo pendiente</dt>
            <dd>{moneda(total - Number(values.anticipo))}</dd>
          </div>
        </dl>
        <p className="catalog-note">
          Pendiente de confirmación del local. Los combos se reservan junto con la mesa; el pago se
          coordina con el local.
        </p>
      </aside>
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={() => navigate(home)}>
          Cancelar
        </Button>
        <Button type="submit" icon={Save} busy={busy} disabled={loading || Boolean(error)}>
          {busy ? 'Guardando...' : original ? 'Guardar cambios' : 'Crear reserva'}
        </Button>
      </div>
    </form>
  )
}
