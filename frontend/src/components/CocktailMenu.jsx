import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { moneda } from '../utils/reservas.js'
import whiskyPhoto from '../assets/nightlife/bar-cocktails.jpg'
import citrusPhoto from '../assets/nightlife/citrus.jpg'
import barPhoto from '../assets/nightlife/club.jpg'
import clubPhoto from '../assets/nightlife/dancefloor.jpg'
import useRemote from '../utils/useRemote.js'
import { Button, LoadingState } from './ui.jsx'

const photos = { bar: barPhoto, whisky: whiskyPhoto, citrus: citrusPhoto }
const pageSize = 4

export default function CocktailMenu() {
  const { data, loading, error, refresh } = useRemote('/carta')
  return (
    <section id="tragos" className="cocktail-section" tabIndex={-1} aria-label="Carta de tragos">
      {loading ? (
        <LoadingState label="Cargando la carta..." />
      ) : error ? (
        <div role="alert">
          <h2>Carta de tragos</h2>
          <p>{error}</p>
          <Button onClick={refresh}>Reintentar carta</Button>
        </div>
      ) : !data?.length ? (
        <>
          <h2>Carta de tragos</h2>
          <p>No hay productos disponibles por el momento.</p>
        </>
      ) : (
        <CocktailBook drinks={data} />
      )}
    </section>
  )
}

function CocktailBook({ drinks }) {
  const categories = ['Todos', ...new Set(drinks.map((item) => item.category))]
  const [category, setCategory] = useState('Todos')
  const [selectedId, setSelectedId] = useState(drinks[0].id)
  const [opened, setOpened] = useState(false)
  const [openComplete, setOpenComplete] = useState(false)
  const book = useRef(null)
  const cover = useRef(null)
  const returnToCover = useRef(false)
  const detail = useRef(null)
  const selected = drinks.find((drink) => drink.id === selectedId)
  const visibleDrinks = drinks.filter(
    (drink) => category === 'Todos' || drink.category === category,
  )
  const selectedIndex = visibleDrinks.findIndex((drink) => drink.id === selectedId)
  const pageIndex = Math.floor(selectedIndex / pageSize)
  const pageCount = Math.ceil(visibleDrinks.length / pageSize)
  const pageDrinks = visibleDrinks.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  useEffect(() => {
    if (!opened) return
    let active = true
    const animations = Array.from(book.current.querySelectorAll('.menu-flap, .menu-leaf')).flatMap(
      (element) => element.getAnimations(),
    )
    Promise.all(animations.map((animation) => animation.finished.catch(() => {}))).then(() => {
      if (active) setOpenComplete(true)
    })
    return () => {
      active = false
    }
  }, [opened])

  useEffect(() => {
    if (!opened && returnToCover.current) {
      returnToCover.current = false
      cover.current?.focus({ preventScroll: true })
    }
    if (openComplete && document.activeElement === cover.current) {
      book.current?.querySelector('.menu-close')?.focus({ preventScroll: true })
    }
  }, [opened, openComplete])

  function chooseDrink(id) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 700px)').matches) {
      detail.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      })
    }
  }

  function changeCategory(next) {
    setCategory(next)
    const available = drinks.filter((drink) => next === 'Todos' || drink.category === next)
    if (!available.some((drink) => drink.id === selectedId)) setSelectedId(available[0].id)
  }

  function step(direction) {
    setSelectedId(
      visibleDrinks[(selectedIndex + direction + visibleDrinks.length) % visibleDrinks.length].id,
    )
  }

  function renderIndex(preview = false) {
    return (
      <>
        <div className="menu-page-top">
          <span>BRICKWELL</span>
          <span>Bar & night club</span>
        </div>
        <h3>La carta.</h3>
        <div className="drink-filters" role="group" aria-label="Filtrar tragos">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => changeCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div
          className="drink-list"
          key={`${category}-${pageIndex}`}
          aria-label="Tragos disponibles en la carta"
        >
          {pageDrinks.map((drink) => (
            <button
              type="button"
              key={drink.id}
              className={drink.id === selectedId ? 'is-selected' : ''}
              aria-pressed={drink.id === selectedId}
              aria-controls={preview ? undefined : 'drink-detail'}
              aria-label={`${drink.name} ${drink.category}`}
              aria-describedby={preview ? undefined : `menu-price-${drink.id}`}
              onClick={() => chooseDrink(drink.id)}
            >
              <span>
                <strong>{drink.name}</strong>
                <small>{drink.category}</small>
              </span>
              <span
                className="drink-list-price"
                id={preview ? undefined : `menu-price-${drink.id}`}
              >
                {moneda(drink.price)}
              </span>
              <ArrowUpRight size={24} strokeWidth={1.3} aria-hidden="true" />
            </button>
          ))}
        </div>
        <nav className="menu-page-navigation" aria-label="Páginas de la carta">
          <button
            type="button"
            aria-label="Página anterior de la carta"
            title="Página anterior"
            disabled={pageIndex === 0}
            onClick={() => setSelectedId(visibleDrinks[(pageIndex - 1) * pageSize].id)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span aria-live={preview ? undefined : 'polite'}>
            Página {pageIndex + 1} de {pageCount}
          </span>
          <button
            type="button"
            aria-label="Página siguiente de la carta"
            title="Página siguiente"
            disabled={pageIndex === pageCount - 1}
            onClick={() => setSelectedId(visibleDrinks[(pageIndex + 1) * pageSize].id)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </nav>
        <p className="menu-footnote">
          Precios de ejemplo en ARS, sujetos a confirmación del local.
          <br />
          Imágenes de ambientación. Consultá disponibilidad en la barra.
        </p>
      </>
    )
  }

  return (
    <>
      <div className="section-intro">
        <span className="section-marker">En la barra</span>
        <h2 id="drinks-heading">
          Hay un trago
          <br />
          para tu noche.
        </h2>
        <p>
          Un clásico de siempre o tu próximo favorito.
          <br />
          Abrí la carta y elegí con qué brindar.
        </p>
      </div>

      <div
        className={`menu-book ${opened ? 'is-open' : ''} ${openComplete ? 'is-ready' : ''}`}
        ref={book}
      >
        <div className="menu-scene">
          <img
            src={clubPhoto}
            alt="Cabina de DJ iluminada, imagen de ambientación"
            width="1200"
            height="800"
            loading="lazy"
          />
        </div>
        <button
          type="button"
          className="menu-close"
          aria-label="Cerrar carta"
          title="Cerrar carta"
          hidden={!openComplete}
          onClick={() => {
            returnToCover.current = true
            setOpenComplete(false)
            setOpened(false)
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="menu-leaves" aria-hidden="true" inert>
          {[0, 1, 2].map((index) => (
            <div
              className={`menu-leaf ${index === 2 ? 'menu-leaf-prices' : ''}`}
              key={index}
              style={{ '--leaf-index': index }}
            >
              {index === 2 ? (
                [false, true].map((back) => (
                  <div
                    className={`menu-index menu-leaf-price-face ${back ? 'is-back' : ''}`}
                    key={String(back)}
                  >
                    {renderIndex(true)}
                  </div>
                ))
              ) : (
                <>
                  <span>BRICKWELL</span>
                  <img src={[whiskyPhoto, citrusPhoto][index]} alt="" />
                  <span>{['Clásicos', 'Frescos'][index]}</span>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="menu-flap">
          <button
            type="button"
            className="menu-cover"
            ref={cover}
            aria-label="Abrir carta de tragos"
            onClick={() => setOpened(true)}
            aria-expanded={opened}
            aria-controls="cocktail-pages"
            tabIndex={opened ? -1 : 0}
            aria-hidden={opened || undefined}
          >
            <span>La carta</span>
            <strong>BRICKWELL</strong>
            <span>
              Tragos & combos <Plus size={20} aria-hidden="true" />
            </span>
          </button>
          <div className="menu-cover-back" aria-hidden="true" />
        </div>

        <div id="cocktail-pages" className="menu-pages" inert={!openComplete}>
          <div className="menu-index">{renderIndex()}</div>

          <div
            id="drink-detail"
            className="drink-detail"
            ref={detail}
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="drink-photo">
              <img
                src={photos[selected.image] || barPhoto}
                alt={selected.alt}
                style={{ objectPosition: selected.position }}
                width="640"
                height="520"
                loading="lazy"
              />
              <span>{selected.category}</span>
            </div>
            <div className="drink-copy" key={selected.id}>
              <h3>{selected.name}</h3>
              <div className="drink-price">
                <strong>{moneda(selected.price)}</strong>
                <span>{selected.serving || 'Por trago'} · Precio de ejemplo</span>
              </div>
              <p className="drink-character">{selected.character}</p>
              <p className="drink-description">{selected.description}</p>
              <p className="drink-ingredients">{selected.ingredients}</p>
            </div>
            <div className="drink-pagination">
              <span>
                {String(selectedIndex + 1).padStart(2, '0')} /{' '}
                {String(visibleDrinks.length).padStart(2, '0')}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Trago anterior"
                  disabled={visibleDrinks.length < 2}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Trago siguiente"
                  disabled={visibleDrinks.length < 2}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="menu-bottom-note">Buenas mezclas. Mejores encuentros.</p>
    </>
  )
}
