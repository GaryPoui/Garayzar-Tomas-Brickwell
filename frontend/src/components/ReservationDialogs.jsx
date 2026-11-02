import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button, LoadingState, StatusBadge } from './ui.jsx'
import { useAuth, useNotification, useReservas } from '../utils/applicationContext.js'
import { eliminarReserva, modificarReserva, obtenerReserva } from '../services/reservaService.js'
import { fechaLegible, moneda, referencia } from '../utils/reservas.js'

export function ReservationDetail({ id, onClose }) {
  const { staff, user } = useAuth()
  const [reserva, setReserva] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const notify = useNotification()
  const reportError = useEffectEvent((message) => notify(message, 'error'))
  useEffect(() => {
    const controller = new AbortController()
    obtenerReserva(id, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setReserva(data)
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure.message)
          reportError(failure.message)
        }
      })
    return () => controller.abort()
  }, [id, retry])

  return (
    <Modal title={`Reserva #${id}`} onClose={onClose}>
      {error ? (
        <div className="inline-error">
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setError('')
              setRetry((value) => value + 1)
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : !reserva ? (
        <LoadingState label="Cargando detalle..." />
      ) : (
        <>
          <StatusBadge estado={reserva.estado} />
          <dl className="detail-grid">
            <div>
              <dt>Fecha</dt>
              <dd>{fechaLegible(reserva.fecha)}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>{reserva.horario} h</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{staff ? referencia(reserva.cliente) : user.nombre}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>{reserva.detalleMesa?.sectorNombre || referencia(reserva.sector)}</dd>
            </div>
            <div>
              <dt>{reserva.detalleMesa ? 'Mesa y personas' : 'Paquete'}</dt>
              <dd>
                {reserva.detalleMesa
                  ? `${reserva.detalleMesa.nombre} · ${reserva.personas} personas · ${reserva.detalleMesa.cercania}`
                  : referencia(reserva.paquete)}
              </dd>
            </div>
            <div>
              <dt>Precio total</dt>
              <dd>{moneda(reserva.precioTotal)}</dd>
            </div>
            <div>
              <dt>Anticipo</dt>
              <dd>{moneda(reserva.anticipo)}</dd>
            </div>
            <div>
              <dt>Saldo pendiente</dt>
              <dd>{moneda(reserva.precioTotal - reserva.anticipo)}</dd>
            </div>
          </dl>
          {reserva.mesa && (
            <section className="reservation-detail-combos" aria-label="Combos anticipados">
              <h3>Combos anticipados</h3>
              {reserva.combos.length ? (
                reserva.combos.map((item) => (
                  <p key={item.id}>
                    <span>
                      {item.cantidad} × {item.nombre}
                    </span>
                    <strong>{moneda(item.subtotal)}</strong>
                  </p>
                ))
              ) : (
                <p>Sin combos agregados</p>
              )}
              <p>Pago a coordinar con el local. No se realizó un cobro en línea.</p>
            </section>
          )}
          <footer className="modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            {staff && (
              <Link className="button button-primary" to={`/reservas/${id}/editar`}>
                <Pencil size={17} aria-hidden="true" />
                Editar reserva
              </Link>
            )}
          </footer>
        </>
      )}
    </Modal>
  )
}

export function DeleteReservation({ reserva, onClose }) {
  const [busy, setBusy] = useState(false)
  const notify = useNotification()
  const { refresh } = useReservas()
  async function remove() {
    if (busy) return
    setBusy(true)
    try {
      await eliminarReserva(reserva.id)
      notify(`La reserva #${reserva.id} se eliminó correctamente.`)
      refresh()
      onClose()
    } catch (error) {
      notify(error.message, 'error')
      setBusy(false)
    }
  }
  return (
    <Modal title="Eliminar reserva" onClose={onClose} busy={busy}>
      <div className="delete-warning">
        <TriangleAlert size={28} aria-hidden="true" />
        <p>
          ¿Eliminar la reserva <strong>#{reserva.id}</strong> del{' '}
          <strong>{fechaLegible(reserva.fecha)}</strong>? Esta acción no se puede deshacer.
        </p>
      </div>
      <footer className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose} data-autofocus>
          Conservar reserva
        </Button>
        <Button variant="danger" icon={Trash2} busy={busy} onClick={remove}>
          {busy ? 'Eliminando...' : 'Eliminar reserva'}
        </Button>
      </footer>
    </Modal>
  )
}

export function ValidateReservation({ reserva, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { refresh } = useReservas()
  const notify = useNotification()
  async function validate() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await modificarReserva(reserva.id, { estado: 'CONFIRMADA' })
      refresh()
      notify(`La reserva #${reserva.id} quedó confirmada.`)
      onClose()
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }
  return (
    <Modal title="Validar reserva" onClose={onClose} busy={busy}>
      <p>
        ¿Confirmar la reserva #{reserva.id} del {fechaLegible(reserva.fecha)} a las{' '}
        {reserva.horario} h?
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <footer className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose} data-autofocus>
          Volver
        </Button>
        <Button icon={Check} busy={busy} onClick={validate}>
          {busy ? 'Validando...' : 'Confirmar reserva'}
        </Button>
      </footer>
    </Modal>
  )
}
