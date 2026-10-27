import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { moneda } from '../utils/reservas.js'
import whiskyPhoto from '../assets/nightlife/bar-cocktails.jpg'
import citrusPhoto from '../assets/nightlife/citrus.jpg'
import barPhoto from '../assets/nightlife/club.jpg'
import clubPhoto from '../assets/nightlife/dancefloor.jpg'

const drinks = [
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    price: 9000,
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
    price: 7500,
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
    price: 8500,
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
    price: 7500,
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
    price: 5000,
    category: 'Sin alcohol',
    character: 'Todo el sabor. Cero alcohol.',
    description:
      'Limón, naranja y hojas de menta con un final de soda. Una mezcla fresca y perfumada para brindar a tu manera.',
    ingredients: 'Limón · naranja · menta · almíbar · soda',
    image: citrusPhoto,
    alt: 'Inspiración de coctelería con cítricos y hierbas frescas',
    position: '15% center',
  },
  {
    id: 'gin-tonic',
    name: 'Gin tonic',
    price: 8000,
    category: 'Clásicos',
    character: 'Botánicos, cítricos y burbujas.',
    description: 'Gin con tónica, una rodaja de limón y abundante hielo.',
    ingredients: 'Gin · tónica · limón · hielo',
    image: citrusPhoto,
    alt: 'Cócteles cítricos como inspiración de presentación',
    position: '60% center',
  },
  {
    id: 'fernet-cola',
    name: 'Fernet con cola',
    price: 7000,
    category: 'Clásicos',
    character: 'El clásico de cada encuentro.',
    description: 'Fernet Branca y Coca-Cola, servidos con hielo.',
    ingredients: 'Fernet Branca · Coca-Cola · hielo',
    image: barPhoto,
    alt: 'Barra de coctelería iluminada',
    position: '45% center',
  },
  {
    id: 'cuba-libre',
    name: 'Cuba libre',
    price: 7500,
    category: 'Clásicos',
    character: 'Ron, lima y un clásico de fondo.',
    description: 'Ron blanco, cola y lima fresca sobre hielo.',
    ingredients: 'Ron blanco · cola · lima · hielo',
    image: whiskyPhoto,
    alt: 'Cóctel sobre la barra como inspiración de presentación',
    position: '62% center',
  },
  {
    id: 'aperol-spritz',
    name: 'Aperol spritz',
    price: 8000,
    category: 'Frescos',
    character: 'Un aperitivo con acento naranja.',
    description: 'Aperol, espumante y soda con una rodaja de naranja.',
    ingredients: 'Aperol · espumante · soda · naranja',
    image: citrusPhoto,
    alt: 'Selección de cócteles con frutas frescas',
    position: '35% center',
  },
  {
    id: 'pomelo',
    name: 'Pomelo & romero',
    price: 4500,
    category: 'Sin alcohol',
    character: 'Cítrico y herbal.',
    description: 'Jugo de pomelo, un toque de almíbar y soda, terminado con romero.',
    ingredients: 'Pomelo · romero · almíbar · soda',
    image: citrusPhoto,
    alt: 'Tragos con cítricos y hierbas como inspiración de presentación',
    position: '75% center',
  },
  {
    id: 'smirnoff-speed',
    name: 'Smirnoff + Speed',
    price: 38000,
    category: 'Combos',
    serving: '1 botella + 4 latas',
    character: 'Vodka y energizante.',
    description: 'Una botella de Smirnoff de 700 ml y cuatro latas de Speed de 250 ml, con hielo.',
    ingredients: 'Smirnoff 700 ml · 4 Speed de 250 ml · hielo',
    image: barPhoto,
    alt: 'Barra del club como imagen de ambientación; no representa el combo',
    position: '45% center',
  },
  {
    id: 'smirnoff-sprite',
    name: 'Smirnoff + Sprite',
    price: 34000,
    category: 'Combos',
    serving: '1 botella + 2 gaseosas',
    character: 'Vodka y lima-limón.',
    description: 'Una botella de Smirnoff de 700 ml, dos Sprite de 1,5 litros y hielo.',
    ingredients: 'Smirnoff 700 ml · 2 Sprite de 1,5 l · hielo',
    image: barPhoto,
    alt: 'Barra del club como imagen de ambientación; no representa el combo',
    position: '45% center',
  },
  {
    id: 'branca-coca',
    name: 'Branca + Coca-Cola',
    price: 42000,
    category: 'Combos',
    serving: '1 botella + 2 gaseosas',
    character: 'Fernet y cola.',
    description: 'Una botella de Fernet Branca de 750 ml, dos Coca-Cola de 1,5 litros y hielo.',
    ingredients: 'Fernet Branca 750 ml · 2 Coca-Cola de 1,5 l · hielo',
    image: barPhoto,
    alt: 'Barra del club como imagen de ambientación; no representa el combo',
    position: '45% center',
  },
  {
    id: 'gin-tonicas',
    name: 'Gin + tónicas',
    price: 45000,
    category: 'Combos',
    serving: '1 botella + 4 tónicas',
    character: 'Un clásico para la mesa.',
    description: 'Una botella de gin de 700 ml, cuatro tónicas de 269 ml, limón y hielo.',
    ingredients: 'Gin 700 ml · 4 tónicas de 269 ml · limón · hielo',
    image: barPhoto,
    alt: 'Barra del club como imagen de ambientación; no representa el combo',
    position: '45% center',
  },
]

const categories = ['Todos', 'Clásicos', 'Frescos', 'Sin alcohol', 'Combos']
const pageSize = 4

export default function CocktailMenu() {
  const [category, setCategory] = useState('Todos')
  const [selectedId, setSelectedId] = useState(drinks[0].id)
  const [opened, setOpened] = useState(false)
  const [openComplete, setOpenComplete] = useState(false)
  const flap = useRef(null)
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
    const animations = flap.current.getAnimations()
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
        <div className="menu-flap" ref={flap}>
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
          <div className="menu-index">
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
                  aria-controls="drink-detail"
                  aria-label={`${drink.name} ${drink.category}`}
                  aria-describedby={`menu-price-${drink.id}`}
                  onClick={() => chooseDrink(drink.id)}
                >
                  <span>
                    <strong>{drink.name}</strong>
                    <small>{drink.category}</small>
                  </span>
                  <span className="drink-list-price" id={`menu-price-${drink.id}`}>
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
              <span aria-live="polite">
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
    </section>
  )
}
