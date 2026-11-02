import { Link } from 'react-router-dom'
import { ArrowUpRight, Armchair, RefreshCw, Users } from 'lucide-react'
import useCatalogo from '../utils/useCatalogo.js'
import { moneda } from '../utils/reservas.js'
import { Button, LoadingState } from './ui.jsx'

export default function ReservationOptions() {
  const { catalogo, loading, error, refresh } = useCatalogo()
  return (
    <section className="reservation-options" aria-labelledby="options-heading">
      <div className="section-heading">
        <h2 id="options-heading">Tu lugar en la noche</h2>
        <span className="section-caption">Mesas · Sectores · Combos</span>
      </div>
      {loading ? (
        <LoadingState label="Cargando sectores y precios..." />
      ) : error ? (
        <div className="catalog-failure">
          <p>{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>
            Reintentar catálogo
          </Button>
        </div>
      ) : (
        <>
          <div className="sector-offers">
            {catalogo.sectores.map((sector) => (
              <article key={sector.id} className={`sector-offer venue-zone-${sector.id}`}>
                <Armchair size={24} aria-hidden="true" />
                <span className="sector-distance">{sector.cercania}</span>
                <h3>{sector.tipo}</h3>
                <p>{sector.descripcion}</p>
                <span className="sector-capacity">
                  <Users size={16} aria-hidden="true" />
                  Hasta {sector.personasPorMesa} personas
                </span>
                <strong className="sector-price">
                  {moneda(sector.precio)}
                  <small> por mesa</small>
                </strong>
                <Link
                  to={`/reservas/nueva?sector=${sector.id}`}
                  className="button button-secondary"
                >
                  Elegir {sector.nombre}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <p className="catalog-note">{catalogo.referencia}</p>
        </>
      )}
    </section>
  )
}
