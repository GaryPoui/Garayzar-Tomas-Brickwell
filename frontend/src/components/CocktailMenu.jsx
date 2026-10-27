import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import whiskyPhoto from '../assets/nightlife/bar-cocktails.jpg'
import citrusPhoto from '../assets/nightlife/citrus.jpg'
import barPhoto from '../assets/nightlife/club.jpg'

const drinks = [
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    category: 'Clásicos',
    character: 'Intenso, con un final suave.',
    description:
      'Whisky, un toque de dulzor y el aroma de la naranja. Un clásico para disfrutar despacio, mientras la noche toma ritmo.',
    ingredients: 'Whisky · azúcar · bitter · naranja',
    image: whiskyPhoto,
    alt: 'Cóctel ámbar con un gran cubo de hielo y piel de naranja',
    position: '62% center',
  },
  {
    id: 'mojito',
    name: 'Mojito',
    category: 'Frescos',
    character: 'Fresco desde el primer sorbo.',
    description:
      'La lima y la menta se encuentran con el ron y las burbujas. Ligero, cítrico y con toda la frescura que pide la pista.',
    ingredients: 'Ron blanco · lima · menta · azúcar · soda',
    image: citrusPhoto,
    alt: 'Selección de cócteles frescos con lima, menta y frutas',
    position: '50% center',
  },
  {
    id: 'negroni',
    name: 'Negroni',
    category: 'Clásicos',
    character: 'Amargo, aromático, inolvidable.',
    description:
      'Gin, vermut rojo y bitter en equilibrio. Una mezcla con carácter, servida con hielo y un perfume de naranja.',
    ingredients: 'Gin · vermut rojo · bitter italiano · naranja',
    image: barPhoto,
    alt: 'Bartender preparando un cóctel sobre una barra iluminada',
    position: '45% center',
  },
  {
    id: 'caipirinha',
    name: 'Caipirinha',
    category: 'Frescos',
    character: 'Un viaje de ida al verano.',
    description:
      'Cachaça, lima recién cortada y azúcar sobre mucho hielo. Simple, vibrante y con ese punto justo entre dulce y ácido.',
    ingredients: 'Cachaça · lima · azúcar · hielo',
    image: citrusPhoto,
    alt: 'Tragos cítricos con fruta fresca sobre la barra',
    position: '25% center',
  },
  {
    id: 'citrus',
    name: 'Citrus & menta',
    category: 'Sin alcohol',
    character: 'Todo el sabor. Cero alcohol.',
    description:
      'Limón, naranja y hojas de menta con un final de soda. Una mezcla fresca y perfumada para brindar a tu manera.',
    ingredients: 'Limón · naranja · menta · almíbar · soda',
    image: citrusPhoto,
    alt: 'Inspiración de coctelería con cítricos y hierbas frescas',
    position: '15% center',
  },
]

const categories = ['Todos', 'Clásicos', 'Frescos', 'Sin alcohol']

export default function CocktailMenu() {
  const [category, setCategory] = useState('Todos')
  const [selectedId, setSelectedId] = useState(drinks[0].id)
  const [opened, setOpened] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const book = useRef(null)
  const cover = useRef(null)
  const detail = useRef(null)
  const selected = drinks.find((drink) => drink.id === selectedId)
  const visibleDrinks = drinks.filter(
    (drink) => category === 'Todos' || drink.category === category,
  )
  const selectedIndex = visibleDrinks.findIndex((drink) => drink.id === selectedId)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setOpened(true)
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2 },
    )
    observer.observe(book.current)
    const respectPreference = () => {
      if (media.matches) setOpened(true)
    }
    media.addEventListener('change', respectPreference)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', respectPreference)
    }
  }, [])

  useEffect(() => {
    if (opened && document.activeElement === cover.current) {
      book.current?.querySelector('.drink-filters button')?.focus({ preventScroll: true })
    }
  }, [opened])

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

  return (
    <section
      id="tragos"
      className="cocktail-section"
      aria-labelledby="drinks-heading"
      tabIndex={-1}
    >
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

      <div className={`menu-book ${opened ? 'is-open' : ''}`} ref={book}>
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
          <span>BRICKWEEL</span>
          <strong>
            La
            <br />
            <i>carta.</i>
          </strong>
          <span>
            Deslizá para descubrir <Plus size={20} aria-hidden="true" />
          </span>
        </button>

        <div id="cocktail-pages" className="menu-pages" inert={!opened}>
          <div className="menu-index">
            <div className="menu-page-top">
              <span>BRICKWEEL</span>
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
            <div className="drink-list" aria-label="Tragos disponibles en la carta">
              {visibleDrinks.map((drink) => (
                <button
                  type="button"
                  key={drink.id}
                  className={drink.id === selectedId ? 'is-selected' : ''}
                  aria-pressed={drink.id === selectedId}
                  aria-controls="drink-detail"
                  onClick={() => chooseDrink(drink.id)}
                >
                  <span>
                    <strong>{drink.name}</strong>
                    <small>{drink.category}</small>
                  </span>
                  <ArrowUpRight size={24} strokeWidth={1.3} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="menu-footnote">
              Elegí un trago para descubrirlo.
              <br />
              Consultá disponibilidad en la barra.
            </p>
          </div>

          <div
            id="drink-detail"
            className="drink-detail"
            ref={detail}
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="drink-photo">
              <img
                src={selected.image}
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
    </section>
  )
}
