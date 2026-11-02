import { Check, Eye, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fechaLegible, moneda, referencia } from '../utils/reservas.js'
import { IconButton, StatusBadge } from './ui.jsx'
import { useAuth } from '../utils/applicationContext.js'

export default function ReservationList({ reservas, onDetail, onDelete, onValidate }) {
  const { staff, user } = useAuth()
  return (
    <div className={`reservation-list${staff ? ' management-list' : ''}`}>
      <div className="table-heading" aria-hidden="true">
        <span>Reserva / cliente</span>
        <span>Fecha y horario</span>
        <span>Sector / paquete</span>
        <span>Importe total</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>
      <ul className="reservation-rows" aria-label="Listado de reservas">
        {reservas.map((reserva) => (
          <li className="reservation-row" key={reserva.id} data-state={reserva.estado}>
            <div className="reservation-identity">
              <span className="reservation-number">{String(reserva.id).padStart(2, '0')}</span>
              <div>
                <button type="button" className="text-button" onClick={() => onDetail(reserva.id)}>
                  Reserva #{reserva.id}
                </button>
                <small>{staff ? `Cliente ${referencia(reserva.cliente)}` : user.nombre}</small>
              </div>
            </div>
            <div className="row-cell">
              <span className="mobile-label">Fecha</span>
              <strong>{fechaLegible(reserva.fecha)}</strong>
              <small className="reservation-time">{reserva.horario} h</small>
            </div>
            <div className="row-cell">
              <strong>
                {reserva.detalleMesa
                  ? `${reserva.detalleMesa.sectorNombre} · ${reserva.detalleMesa.nombre}`
                  : `Sector ${referencia(reserva.sector)}`}
              </strong>
              <small>
                {reserva.mesa
                  ? `${reserva.personas} personas · ${reserva.combos.reduce((total, item) => total + item.cantidad, 0)} combos`
                  : `Paquete ${referencia(reserva.paquete)}`}
              </small>
            </div>
            <div className="row-cell">
              <span className="mobile-label">Importe total</span>
              <strong>{moneda(reserva.precioTotal)}</strong>
              <small>Anticipo {moneda(reserva.anticipo)}</small>
            </div>
            <div className="row-status">
              <StatusBadge estado={reserva.estado} />
            </div>
            <div className="row-actions">
              <IconButton
                label={`Ver reserva #${reserva.id}`}
                icon={Eye}
                onClick={() => onDetail(reserva.id)}
              />
              {staff && (
                <>
                  {reserva.estado === 'PENDIENTE' && (
                    <IconButton
                      label={`Validar reserva #${reserva.id}`}
                      icon={Check}
                      onClick={() => onValidate(reserva)}
                    />
                  )}
                  <Link
                    className="icon-button"
                    to={`/reservas/${reserva.id}/editar`}
                    aria-label={`Editar reserva #${reserva.id}`}
                    title={`Editar reserva #${reserva.id}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                  </Link>
                  <IconButton
                    label={`Eliminar reserva #${reserva.id}`}
                    icon={Trash2}
                    className="danger-icon"
                    onClick={() => onDelete(reserva)}
                  />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
