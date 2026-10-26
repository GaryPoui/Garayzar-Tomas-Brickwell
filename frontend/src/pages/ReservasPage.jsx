import { useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDownLeft,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  PageHeading,
} from '../components/ui.jsx'
import ReservationList from '../components/ReservationList.jsx'
import { DeleteReservation, ReservationDetail } from '../components/ReservationDialogs.jsx'
import { useReservas } from '../utils/applicationContext.js'
import { ESTADOS, fechaLegible, fechaLocal, filtrarReservas, moneda } from '../utils/reservas.js'

function Summary({ reservas, unavailable }) {
  const vigentes = reservas.filter((reserva) => reserva.estado !== 'CANCELADA')
  const stats = [
    {
      label: 'Reservas registradas',
      value: reservas.length,
      detail: 'Todas las reservas',
      icon: CalendarDays,
      tone: 'neutral',
    },
    {
      label: 'Por confirmar',
      value: reservas.filter((reserva) => reserva.estado === 'PENDIENTE').length,
      detail: 'Pendientes de confirmación',
      icon: Clock3,
      tone: 'amber',
    },
    {
      label: 'Confirmadas y activas',
      value: reservas.filter((reserva) => ['CONFIRMADA', 'ACTIVA'].includes(reserva.estado)).length,
      detail: 'Con estado confirmada o activa',
      icon: CalendarCheck2,
      tone: 'green',
    },
    {
      label: 'Anticipos registrados',
      value: moneda(vigentes.reduce((total, reserva) => total + Number(reserva.anticipo), 0)),
      detail: 'Reservas no canceladas',
      icon: ArrowDownLeft,
      tone: 'rose',
    },
  ]
  return (
    <section className="summary" aria-label="Resumen de reservas">
      {stats.map(({ label, value, detail, icon: Icon, tone }) => (
        <div className={`stat stat-${tone}`} key={label}>
          <div className="stat-label">
            <span>{label}</span>
            <Icon size={19} aria-hidden="true" />
          </div>
          <strong>{unavailable ? '—' : value}</strong>
          <small>{detail}</small>
        </div>
      ))}
    </section>
  )
}

export default function ReservasPage({ agenda = false }) {
  const { reservas, loading, error, refresh } = useReservas()
  const [params, setParams] = useSearchParams()
  const [detailId, setDetailId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const search = params.get('buscar') || ''
  const estado = params.get('estado') || ''
  const fecha = params.get('fecha') || ''
  const deferredSearch = useDeferredValue(search)
  const upcoming = agenda
    ? reservas.filter((reserva) => reserva.fecha >= fechaLocal() && reserva.estado !== 'CANCELADA')
    : reservas
  const filtered = filtrarReservas(upcoming, { search: deferredSearch, estado, fecha })
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, Math.floor(Number(params.get('pagina'))) || 1), totalPages)
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const dates = [...new Set(visible.map((reserva) => reserva.fecha))]
  const hasFilters = Boolean(search || estado || fecha)

  function setFilter(name, value) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(name, value)
        else next.delete(name)
        if (name !== 'pagina') next.delete('pagina')
        return next
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageHeading
        title={agenda ? 'Agenda de reservas' : 'Reservas'}
        description={
          agenda
            ? 'Consultá las reservas desde hoy, ordenadas por fecha y horario.'
            : 'Organizá cada llegada. Todos los detalles, en un solo lugar.'
        }
      >
        <Button variant="secondary" icon={RefreshCw} busy={loading} onClick={refresh}>
          Actualizar
        </Button>
        <Link className="button button-primary" to="/reservas/nueva">
          <Plus size={18} aria-hidden="true" />
          Nueva reserva
        </Link>
      </PageHeading>
      {!agenda && <Summary reservas={reservas} unavailable={loading || Boolean(error)} />}
      {agenda && (
        <div className="agenda-banner">
          <CalendarDays size={28} aria-hidden="true" />
          <div>
            <strong>Tu próxima jornada, a la vista</strong>
            <span>Desde hoy · Sin reservas canceladas</span>
          </div>
        </div>
      )}
      <section className="reservations-section" aria-labelledby="list-title">
        <div className="section-heading">
          <div>
            <h2 id="list-title">{agenda ? 'Próximas reservas' : 'Todas las reservas'}</h2>
            <span className="count-badge">{loading || error ? '...' : upcoming.length}</span>
          </div>
          <span className="section-caption">
            {agenda ? 'Orden cronológico' : 'Registro completo'}
          </span>
        </div>
        <div className="filters">
          <div className="search-field">
            <label htmlFor="buscar">Buscar reserva</label>
            <Search size={19} aria-hidden="true" />
            <input
              id="buscar"
              name="buscar"
              autoComplete="off"
              type="search"
              placeholder="ID de reserva, cliente, sector o paquete…"
              value={search}
              onChange={(event) => setFilter('buscar', event.target.value)}
            />
          </div>
          <Field
            id="filtro-estado"
            label="Estado"
            value={estado}
            onChange={(event) => setFilter('estado', event.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(ESTADOS)
              .filter(([key]) => !agenda || key !== 'CANCELADA')
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </Field>
          <Field
            id="filtro-fecha"
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(event) => setFilter('fecha', event.target.value)}
          />
          {hasFilters && (
            <IconButton label="Limpiar filtros" icon={X} onClick={() => setParams({})} />
          )}
        </div>
        {hasFilters && (
          <div className="active-filters" aria-label="Filtros activos">
            <span>
              {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            </span>
            {search && <span className="filter-chip">Búsqueda: {search}</span>}
            {estado && <span className="filter-chip">Estado: {ESTADOS[estado] || estado}</span>}
            {fecha && <span className="filter-chip">Fecha: {fechaLegible(fecha)}</span>}
            <button type="button" className="text-button" onClick={() => setParams({})}>
              Limpiar filtros
            </button>
          </div>
        )}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState icon={CircleAlert} title="No pudimos cargar las reservas" description={error}>
            <Button icon={RefreshCw} onClick={refresh}>
              Reintentar
            </Button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? 'No hay coincidencias'
                : agenda
                  ? 'La agenda está libre'
                  : 'Todo empieza con una reserva'
            }
            description={
              hasFilters
                ? 'No encontramos reservas con estos filtros.'
                : agenda
                  ? 'No hay reservas próximas registradas.'
                  : 'Todavía no hay reservas registradas.'
            }
          >
            {hasFilters ? (
              <Button variant="secondary" icon={X} onClick={() => setParams({})}>
                Limpiar filtros
              </Button>
            ) : (
              <Link className="button button-primary" to="/reservas/nueva">
                <Plus size={18} aria-hidden="true" />
                Crear primera reserva
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            {agenda ? (
              dates.map((date) => (
                <section className="agenda-group" key={date} aria-label={fechaLegible(date)}>
                  <h3>
                    <CalendarDays size={18} aria-hidden="true" />
                    {fechaLegible(date)}
                  </h3>
                  <ReservationList
                    reservas={visible.filter((reserva) => reserva.fecha === date)}
                    onDetail={setDetailId}
                    onDelete={setToDelete}
                  />
                </section>
              ))
            ) : (
              <ReservationList reservas={visible} onDetail={setDetailId} onDelete={setToDelete} />
            )}
            <footer className="pagination">
              <span role="status">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de{' '}
                {filtered.length} reservas
              </span>
              <nav aria-label="Páginas de reservas">
                <IconButton
                  label="Página anterior"
                  icon={ChevronLeft}
                  disabled={page === 1}
                  onClick={() => setFilter('pagina', String(page - 1))}
                />
                <span>
                  {page} / {totalPages}
                </span>
                <IconButton
                  label="Página siguiente"
                  icon={ChevronRight}
                  disabled={page === totalPages}
                  onClick={() => setFilter('pagina', String(page + 1))}
                />
              </nav>
            </footer>
          </>
        )}
      </section>

      {detailId !== null && (
        <ReservationDetail key={detailId} id={detailId} onClose={() => setDetailId(null)} />
      )}
      {toDelete && <DeleteReservation reserva={toDelete} onClose={() => setToDelete(null)} />}
    </>
  )
}
