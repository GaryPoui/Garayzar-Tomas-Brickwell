import { Link, useParams } from 'react-router-dom'
import MesaReservaForm from '../components/MesaReservaForm.jsx'
import { EmptyState, LoadingState, Button, PageHeading } from '../components/ui.jsx'
import { useAuth } from '../utils/applicationContext.js'
import useRemote from '../utils/useRemote.js'
import { reservaTransitions } from '../utils/negocio.js'
import '../styles/booking.css'
export default function ReservaFormPage() {
  const { id } = useParams()
  const { staff, home } = useAuth()
  const { data, loading, error, refresh } = useRemote(
    id ? `/reservas/${encodeURIComponent(id)}` : null,
  )
  if (loading) return <LoadingState label="Cargando la reserva..." />
  if (error)
    return (
      <EmptyState title="No pudimos cargar la reserva" description={error}>
        <Button onClick={refresh}>Reintentar</Button>
      </EmptyState>
    )
  if (data && !reservaTransitions[data.estado]?.length)
    return (
      <EmptyState
        title="Esta reserva está cerrada"
        description="Las reservas finalizadas o canceladas se conservan para consulta y no se pueden editar."
      >
        <Link className="button" to={home}>
          Volver a reservas
        </Link>
      </EmptyState>
    )
  return (
    <>
      <Link className="back-link" to={home}>
        ← Volver a reservas
      </Link>
      <PageHeading
        title={id ? `Editar reserva #${id}` : staff ? 'Nueva reserva' : 'Reservar'}
        description="Elegí tu mesa, encontrá tu sector y sumá los combos para tu noche."
      />
      <MesaReservaForm key={id || 'nueva'} original={data || undefined} />
    </>
  )
}
