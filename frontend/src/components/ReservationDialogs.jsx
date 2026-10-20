import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, TriangleAlert } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button, LoadingState, StatusBadge } from './ui.jsx'
import { useNotification, useReservas } from '../utils/applicationContext.js'
import { eliminarReserva, obtenerReserva } from '../services/reservaService.js'
import { fechaLegible, moneda, referencia } from '../utils/reservas.js'

export function ReservationDetail({ id, onClose }) {
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
              <dd>{referencia(reserva.cliente)}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>{referencia(reserva.sector)}</dd>
            </div>
            <div>
              <dt>Paquete</dt>
              <dd>{referencia(reserva.paquete)}</dd>
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
          <footer className="modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Link className="button button-primary" to={`/reservas/${id}/editar`}>
              <Pencil size={17} aria-hidden="true" />
              Editar reserva
            </Link>
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
