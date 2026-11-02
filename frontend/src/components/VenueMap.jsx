import { Armchair, MicVocal, Wine } from 'lucide-react'
import { moneda } from '../utils/reservas.js'

export default function VenueMap({ catalogo, selected, personas, onSelect, error }) {
  return (
    <div className="venue-plan">
      <div className="venue-stage">
        <MicVocal size={20} aria-hidden="true" />
        <strong>ESCENARIO</strong>
      </div>
      <div
        role="group"
        aria-label="Mesas por sector y cercanía al escenario"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'mesa-error' : 'map-note'}
      >
        {catalogo.sectores.map((sector) => (
          <div className={`venue-zone venue-zone-${sector.id}`} key={sector.id}>
            <div className="venue-zone-label">
              <strong>{sector.nombre}</strong>
              <span>{sector.cercania}</span>
            </div>
            <div className="venue-table-row">
              {catalogo.mesas
                .filter((mesa) => mesa.sector === sector.id)
                .map((mesa) => {
                  const unavailable = !mesa.disponible
                  const tooSmall = Number(personas) > mesa.capacidad
                  return (
                    <button
                      type="button"
                      key={mesa.id}
                      className="venue-table"
                      aria-label={`Mesa ${mesa.nombre}, ${mesa.capacidad} personas, ${moneda(mesa.precio)}, ${unavailable ? 'ocupada' : tooSmall ? 'capacidad insuficiente' : 'disponible'}`}
                      aria-pressed={Number(selected) === mesa.id}
                      disabled={unavailable || tooSmall}
                      onClick={() => onSelect(mesa)}
                    >
                      <Armchair size={23} aria-hidden="true" />
                      <strong>{mesa.nombre}</strong>
                      <small>
                        {unavailable
                          ? 'Ocupada'
                          : tooSmall
                            ? 'Sin cupo'
                            : `${mesa.capacidad} pers.`}
                      </small>
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="venue-bar">
        <Wine size={18} aria-hidden="true" />
        BARRA<span>ACCESO</span>
      </div>
      <div className="venue-legend">
        <span>
          <i />
          Disponible
        </span>
        <span>
          <i className="selected" />
          Tu mesa
        </span>
        <span>
          <i className="unavailable" />
          Ocupada / sin cupo
        </span>
      </div>
      <p id="map-note" className="catalog-note">
        Plano orientativo, sin escala. Una reserva por mesa y noche.
      </p>
      {error && (
        <p className="field-error" id="mesa-error">
          {error}
        </p>
      )}
    </div>
  )
}
