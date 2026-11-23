import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useRemote from '../utils/useRemote.js'
import { useAuth } from '../utils/applicationContext.js'
import { crearRecurso } from '../services/negocioService.js'
import { Button, PageHeading } from '../components/ui.jsx'
import RemoteState from '../components/RemoteState.jsx'
import Modal from '../components/Modal.jsx'
import { fechaLegible, moneda, fechaLocal } from '../utils/reservas.js'
import '../styles/negocio.css'
export default function EventosPage() {
  const remote = useRemote('/eventos')
  const { user, home } = useAuth()
  const location = useLocation()
  const [month, setMonth] = useState(fechaLocal().slice(0, 7))
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [now] = useState(() => Date.now())
  const events = (remote.data || [])
    .filter((item) => item.fecha.startsWith(month))
    .toSorted((a, b) => `${a.fecha} ${a.horario}`.localeCompare(`${b.fecha} ${b.horario}`))
  const year = Number(month.slice(0, 4)),
    index = Number(month.slice(5, 7)) - 1
  const days = month ? new Date(year, index + 1, 0).getDate() : 0
  const offset = month ? (new Date(year, index, 1).getDay() + 6) % 7 : 0
  async function buy() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const entrada = await crearRecurso(`/eventos/${selected.id}/entradas`)
      setMessage(
        `Entrada #${entrada.id} registrada. ${entrada.estado === 'CONFIRMADA' ? 'La entrada es sin cargo y está confirmada.' : 'Coordiná el pago con el local. La entrada todavía está pendiente de pago.'}`,
      )
      setSelected(null)
      setConfirming(false)
      remote.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="app-layout public-events">
      <header className="management-header">
        <Link className="brand" to="/">
          BRICKWEEL
        </Link>
        <nav className="extra-navigation" aria-label="Navegación de eventos">
          <Link to="/">Volver al sitio</Link>
          <Link to={user ? home : '/login'}>{user ? 'Mi cuenta' : 'Iniciar sesión'}</Link>
        </nav>
      </header>
      <main className="business-main">
        <PageHeading
          title="Eventos y noches"
          description="Consultá el calendario, conocé cada propuesta y solicitá tu entrada anticipada."
        />
        {message && (
          <p className="business-success" role="status">
            {message} <Link to="/entradas">Ver mis entradas</Link>
          </p>
        )}
        <label className="month-filter">
          Mes del calendario
          <input
            aria-label="Mes del calendario"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            min="2020-01"
            max="2200-12"
          />
        </label>
        <RemoteState remote={remote}>
          <div className="event-calendar" role="group" aria-label="Calendario mensual de eventos">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <span className="calendar-weekday" key={day}>
                {day}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span className="calendar-empty" key={`empty-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const fecha = `${month}-${String(i + 1).padStart(2, '0')}`
              const items = events.filter((item) => item.fecha === fecha)
              return (
                <div className="calendar-day" key={fecha}>
                  <span>{i + 1}</span>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelected(item)
                        setError('')
                        setConfirming(false)
                      }}
                      aria-label={`Ver evento ${item.nombre} del ${fecha}`}
                    >
                      <span className="calendar-event-label">{item.nombre}</span>
                      <span className="calendar-event-dot" aria-hidden="true">
                        ●
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
          {!events.length && <p>No hay eventos publicados para este mes.</p>}
          <div className="business-grid">
            {events.map((item) => (
              <article className="business-card" key={item.id}>
                <p>
                  {fechaLegible(item.fecha)} · {item.horario} h
                </p>
                <h2>{item.nombre}</h2>
                <p>{item.descripcion}</p>
                <p>
                  Anticipada {moneda(item.precioEntrada)} · Puerta {moneda(item.precioPuerta)}
                </p>
                <p>
                  {item.entradasDisponibles
                    ? `${item.entradasDisponibles} entradas disponibles`
                    : 'Entradas agotadas'}
                </p>
                <Button
                  onClick={() => {
                    setSelected(item)
                    setError('')
                    setConfirming(false)
                  }}
                >
                  Ver flyer y entradas
                </Button>
              </article>
            ))}
          </div>
        </RemoteState>
        {selected && (
          <Modal title={selected.nombre} onClose={() => !busy && setSelected(null)} busy={busy}>
            {selected.imagen && (
              <img
                className="event-flyer"
                src={selected.imagen}
                alt={`Flyer de ${selected.nombre}`}
              />
            )}
            <p>
              {fechaLegible(selected.fecha)} · {selected.horario} h
            </p>
            <p>{selected.descripcion}</p>
            {selected.fotoDj && (
              <img
                className="event-dj"
                src={selected.fotoDj}
                alt={selected.dj || 'Artista del evento'}
              />
            )}
            <dl className="detail-grid">
              {[
                ['DJ / artista', selected.dj],
                ['Género musical', selected.generoMusical],
                ['Dress code', selected.dressCode],
                ['Promociones', selected.promociones],
                ['Invitados', selected.presenciasEspeciales],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <p>
              Anticipada {moneda(selected.precioEntrada)} · Puerta {moneda(selected.precioPuerta)}
            </p>
            <p>
              {selected.entradasDisponibles > 0
                ? `${selected.entradasDisponibles} entradas disponibles.`
                : 'Entradas agotadas.'}
            </p>
            {confirming && (
              <p>
                ¿Confirmar una entrada por {moneda(selected.precioEntrada)}? El cupo se reserva al
                confirmar.{' '}
                {selected.precioEntrada > 0 &&
                  'El pago se realiza en el local; el personal debe acreditarlo para habilitar el ingreso.'}
              </p>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <footer className="modal-actions">
              <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>
                Cerrar
              </Button>
              {!user ? (
                <Link
                  className="button button-primary"
                  to="/login"
                  state={{ from: location.pathname }}
                >
                  Ingresar para solicitar entrada
                </Link>
              ) : (
                user.rol === 'CLIENTE' && (
                  <Button
                    onClick={confirming ? buy : () => setConfirming(true)}
                    busy={busy}
                    disabled={
                      !selected.entradasDisponibles ||
                      new Date(`${selected.fecha}T${selected.horario}:00-03:00`).getTime() <= now
                    }
                  >
                    {confirming ? 'Confirmar entrada' : 'Solicitar entrada'}
                  </Button>
                )
              )}
            </footer>
          </Modal>
        )}
      </main>
    </div>
  )
}
