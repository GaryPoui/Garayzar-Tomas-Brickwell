import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, CircleAlert, RefreshCw, Save } from 'lucide-react'
import {
  Button,
  EmptyState,
  Field,
  LoadingState,
  PageHeading,
  StatusBadge,
} from '../components/ui.jsx'
import { useNotification, useReservas } from '../utils/applicationContext.js'
import { crearReserva, modificarReserva, obtenerReserva } from '../services/reservaService.js'
import barPhoto from '../assets/nightlife/club.jpg'
import {
  ESTADOS,
  fechaLegible,
  fechaMinima,
  moneda,
  prepararReserva,
  validarReserva,
  valoresIniciales,
} from '../utils/reservas.js'

function ReservaForm({ original }) {
  const [values, setValues] = useState(() => valoresIniciales(original))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const form = useRef(null)
  const notify = useNotification()
  const { refresh } = useReservas()
  const navigate = useNavigate()

  function change(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      ...(name === 'precioTotal' ? { anticipo: undefined } : {}),
    }))
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
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const failures = validarReserva(values, original)
    setErrors(failures)
    if (Object.keys(failures).length) {
      notify('Revisá los campos señalados antes de guardar la reserva.', 'error')
      form.current.elements.namedItem(Object.keys(failures)[0])?.focus()
      return
    }
    setBusy(true)
    try {
      const datos = prepararReserva(values, original)
      const saved = original
        ? await modificarReserva(original.id, datos)
        : await crearReserva(datos)
      notify(`La reserva #${saved.id} se ${original ? 'actualizó' : 'creó'} correctamente.`)
      refresh()
      navigate('/reservas')
    } catch (error) {
      notify(error.message, 'error')
      setBusy(false)
    }
  }

  return (
    <form ref={form} className="reservation-form" onSubmit={submit} noValidate aria-busy={busy}>
      <div className="form-main">
        <fieldset disabled={busy}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              01
            </span>{' '}
            Fecha y horario
          </legend>
          <div className="form-grid">
            <Field
              {...input('fecha')}
              label="Fecha"
              hint="Para nuevas reservas, elegí una fecha desde mañana."
              type="date"
              min={
                original?.fecha && original.fecha < fechaMinima() ? original.fecha : fechaMinima()
              }
            />
            <Field {...input('horario')} label="Horario" type="time" />
          </div>
          {original && (
            <Field {...input('estado')} label="Estado">
              {Object.entries(ESTADOS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Field>
          )}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              02
            </span>{' '}
            Cliente, sector y paquete
          </legend>
          <p className="fieldset-description">
            Ingresá los identificadores de tus registros. Revisalos antes de guardar.
          </p>
          <div className="form-grid three-columns">
            <Field
              {...input('cliente')}
              label="ID del cliente"
              hint="Identificador del cliente registrado."
              type="number"
              min="1"
              step="1"
              placeholder="Ej.: 1"
            />
            <Field
              {...input('sector')}
              label="ID del sector"
              hint="Identificador del sector de la reserva."
              type="number"
              min="1"
              step="1"
              placeholder="Ej.: 2"
            />
            <Field
              {...input('paquete')}
              label="ID del paquete"
              hint="Identificador del paquete de consumición."
              type="number"
              min="1"
              step="1"
              placeholder="Ej.: 1"
            />
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>
            <span className="fieldset-number" aria-hidden="true">
              03
            </span>{' '}
            Importes
          </legend>
          <div className="form-grid">
            <Field
              {...input('precioTotal')}
              label="Precio total (ARS)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
            <Field
              {...input('anticipo')}
              label="Anticipo (ARS)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>
        </fieldset>
      </div>
      <aside className="form-summary" aria-label="Resumen de la reserva">
        <div className="summary-visual">
          <img
            src={barPhoto}
            alt="Imagen de ambientación de una barra de cócteles"
            width="1200"
            height="840"
          />
        </div>
        <div className="summary-title">
          <h2>Resumen de la reserva</h2>
        </div>
        <StatusBadge estado={values.estado} />
        <div className="summary-date">
          <CalendarDays size={23} aria-hidden="true" />
          <div>
            <strong>
              {values.fecha && !Number.isNaN(new Date(`${values.fecha}T12:00:00`).getTime())
                ? fechaLegible(values.fecha)
                : 'Fecha por definir'}
            </strong>
            <span>{values.horario ? `${values.horario} h` : 'Horario por definir'}</span>
          </div>
        </div>
        <dl className="summary-references">
          <div>
            <dt>Cliente</dt>
            <dd>{values.cliente ? `#${values.cliente}` : 'Sin asignar'}</dd>
          </div>
          <div>
            <dt>Sector</dt>
            <dd>{values.sector ? `#${values.sector}` : 'Sin asignar'}</dd>
          </div>
          <div>
            <dt>Paquete</dt>
            <dd>{values.paquete ? `#${values.paquete}` : 'Sin asignar'}</dd>
          </div>
        </dl>
        <dl className="summary-amounts">
          <div>
            <dt>Precio total</dt>
            <dd>{moneda(values.precioTotal)}</dd>
          </div>
          <div>
            <dt>Anticipo</dt>
            <dd>{moneda(values.anticipo)}</dd>
          </div>
          <div className="summary-balance">
            <dt>Saldo pendiente</dt>
            <dd>{moneda(Number(values.precioTotal) - Number(values.anticipo))}</dd>
          </div>
        </dl>
        <div className="summary-foot">
          <Check size={16} aria-hidden="true" />
          <span>{original ? `Reserva #${original.id}` : 'Estado inicial: pendiente'}</span>
        </div>
      </aside>
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={() => navigate('/reservas')}>
          Cancelar
        </Button>
        <Button type="submit" icon={Save} busy={busy}>
          {busy ? 'Guardando...' : original ? 'Guardar cambios' : 'Crear reserva'}
        </Button>
      </div>
    </form>
  )
}

function ReservaFormPageContent({ id }) {
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const notify = useNotification()
  const reportError = useEffectEvent((message) => notify(message, 'error'))
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    obtenerReserva(id, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setOriginal(data)
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure.message)
          reportError(failure.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, retry])

  return (
    <>
      <Link className="back-link" to="/reservas">
        <ArrowLeft size={17} aria-hidden="true" />
        Volver a reservas
      </Link>
      <PageHeading
        title={id ? 'Editar reserva' : 'Nueva reserva'}
        description={
          id
            ? 'Actualizá los datos de la reserva.'
            : 'Definí la fecha, las referencias y los importes para registrar la reserva.'
        }
      />
      {loading ? (
        <LoadingState label="Cargando reserva..." />
      ) : error ? (
        <EmptyState icon={CircleAlert} title="No pudimos abrir la reserva" description={error}>
          <Button
            icon={RefreshCw}
            onClick={() => {
              setError('')
              setLoading(true)
              setRetry((value) => value + 1)
            }}
          >
            Reintentar
          </Button>
        </EmptyState>
      ) : (
        <ReservaForm key={id || 'nueva'} original={original} />
      )}
    </>
  )
}

export default function ReservaFormPage() {
  const { id } = useParams()
  return <ReservaFormPageContent key={id || 'nueva'} id={id} />
}
