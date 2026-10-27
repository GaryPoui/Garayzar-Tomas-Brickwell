import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, ArrowUp, Menu, X } from 'lucide-react'
import CocktailMenu from '../components/CocktailMenu.jsx'
import HeroWordmark from '../components/HeroWordmark.jsx'
import djPhoto from '../assets/nightlife/dancefloor.jpg'
import crowdPhoto from '../assets/nightlife/crowd.jpg'
import barPhoto from '../assets/nightlife/club.jpg'
import '../styles/home.css'

const navigation = [
  { id: 'noche', label: 'La noche' },
  { id: 'tragos', label: 'Tragos' },
  { id: 'reservar', label: 'Reservas' },
]

export default function HomePage() {
  const { hash, key: locationKey } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('inicio')
  const header = useRef(null)
  const menuButton = useRef(null)
  const hero = useRef(null)

  useEffect(() => {
    document.title = 'BRICKWEEL — La noche empieza acá'
  }, [])

  useEffect(() => {
    const target = document.getElementById(hash.slice(1) || 'inicio')
    if (target) {
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
      if (hash) target.focus({ preventScroll: true })
    }
  }, [hash, locationKey])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0 },
    )
    for (const id of ['inicio', ...navigation.map((item) => item.id)])
      observer.observe(document.getElementById(id))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function closeMenu(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    function outside(event) {
      if (!header.current?.contains(event.target)) setMenuOpen(false)
    }
    if (menuOpen) {
      document.addEventListener('keydown', closeMenu)
      document.addEventListener('pointerdown', outside)
    }
    return () => {
      document.removeEventListener('keydown', closeMenu)
      document.removeEventListener('pointerdown', outside)
    }
  }, [menuOpen])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    function update() {
      const progress = media.matches ? 0 : Math.min(window.scrollY / window.innerHeight, 1)
      hero.current?.style.setProperty('--hero-scroll', progress.toFixed(3))
      frame = 0
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    media.addEventListener('change', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      media.removeEventListener('change', update)
    }
  }, [])

  function closeNavigation(event) {
    setMenuOpen(false)
    const id = event.currentTarget.dataset.section
    if (hash === `#${id}`) {
      const target = document.getElementById(id)
      target?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
      target?.focus({ preventScroll: true })
    }
  }

  return (
    <div className="night-site">
      <a
        className="night-skip"
        href="#/"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('night-content')?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <header className="night-header" ref={header}>
        <Link
          to="/#inicio"
          className="night-brand"
          aria-label="BRICKWEEL, inicio"
          data-section="inicio"
          onClick={closeNavigation}
        >
          BRICKWEEL<span aria-hidden="true">✳</span>
        </Link>
        <span className="header-location">Necochea, Argentina</span>
        <button
          type="button"
          ref={menuButton}
          className="night-menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="night-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <nav
          id="night-navigation"
          className={menuOpen ? 'is-open' : ''}
          aria-label="Navegación principal"
        >
          {navigation.map(({ id, label }) => (
            <Link
              key={id}
              to={`/#${id}`}
              data-section={id}
              onClick={closeNavigation}
              aria-current={active === id ? 'location' : undefined}
              className={id === 'reservar' ? 'header-reserve' : ''}
            >
              {label}
              {id === 'reservar' && <ArrowUpRight size={17} aria-hidden="true" />}
            </Link>
          ))}
        </nav>
      </header>

      <main id="night-content" tabIndex={-1}>
        <section
          id="inicio"
          className="night-hero"
          ref={hero}
          aria-labelledby="hero-title"
          tabIndex={-1}
        >
          <HeroWordmark />
          <div className="hero-caption">
            <span>Pub bar & night club</span>
            <span>El punto de encuentro.</span>
          </div>
          <div className="hero-photo">
            <img
              src={djPhoto}
              alt="DJ mezclando música entre luces violetas y reflejos de la pista"
              width="1800"
              height="1200"
              fetchPriority="high"
            />
            <div className="hero-photo-copy">
              <span>La música sube.</span>
              <span>La noche recién empieza.</span>
            </div>
            <Link to="/#noche" className="hero-scroll" aria-label="Descubrir la noche">
              <ArrowDown size={25} strokeWidth={1.2} />
            </Link>
          </div>
          <div className="hero-baseline">
            <span>Buen sonido. Buenos tragos. Tu gente.</span>
            <span>
              Deslizá y entrá en clima <ArrowDown size={14} aria-hidden="true" />
            </span>
          </div>
        </section>

        <section
          id="noche"
          className="night-experience"
          aria-labelledby="night-heading"
          tabIndex={-1}
        >
          <div className="experience-intro">
            <span className="section-marker">La noche, a tu manera</span>
            <h2 id="night-heading">
              Hay noches que
              <br />
              se quedan con vos.
            </h2>
            <div className="experience-copy">
              <p>
                BRICKWEEL es un pub bar y boliche en Necochea donde la barra y la pista son parte
                del mismo plan. Un lugar para encontrarte con amigos, compartir un trago y dejar que
                la música marque el ritmo de la noche.
              </p>
              <p>
                Podés empezar con una charla, descubrir una nueva mezcla o ir directo a bailar. No
                todas las salidas tienen que ser iguales: a veces se festeja algo, otras veces
                alcanza con estar juntos. Acá hay lugar para las dos.
              </p>
            </div>
          </div>
          <div className="night-gallery">
            <figure className="gallery-dance">
              <img
                src={crowdPhoto}
                alt="Manos en el aire frente a un escenario lleno de luces violetas"
                width="1200"
                height="800"
                loading="lazy"
              />
              <figcaption>
                <span>Perdete en la música.</span>
                <span>El resto puede esperar.</span>
              </figcaption>
              <p className="gallery-story">
                La pista es el punto de encuentro cuando la música sube. Luces, movimiento y ese
                tema que cambia el ánimo del grupo: la noche se vive entre quienes llegan con vos y
                quienes se suman en el camino.
              </p>
            </figure>
            <figure className="gallery-bar">
              <img
                src={barPhoto}
                alt="Preparación de un trago en una barra de boliche con luces cálidas y violetas"
                width="1200"
                height="840"
                loading="lazy"
              />
              <figcaption>
                <span>Nos vemos en la barra.</span>
                <Link to="/#tragos" aria-label="Descubrir la carta de tragos">
                  <ArrowUpRight size={24} strokeWidth={1.2} />
                </Link>
              </figcaption>
              <p className="gallery-story">
                En la barra conviven los cócteles clásicos, las mezclas frescas y las opciones sin
                alcohol. También hay combos para la mesa. Un momento para elegir algo distinto,
                seguir la conversación y volver a la pista cuando suene tu tema.
              </p>
            </figure>
          </div>
          <p className="photo-note">Imágenes de ambientación.</p>
        </section>

        <CocktailMenu />

        <section
          id="reservar"
          className="night-reservations"
          aria-labelledby="reservation-heading"
          tabIndex={-1}
        >
          <div className="reservation-visual">
            <img
              src={barPhoto}
              alt="Una barra iluminada lista para el próximo encuentro"
              width="1200"
              height="840"
              loading="lazy"
            />
            <span>Un lugar para encontrarnos.</span>
          </div>
          <div className="reservation-copy">
            <span className="section-marker">Reservas</span>
            <h2 id="reservation-heading">
              Vos traé
              <br />a tu gente.
            </h2>
            <p>
              El primer paso de una buena noche: elegir cuándo nos vemos. Organizá tu salida y
              completá tu reserva.
            </p>
            <Link to="/reservas/nueva" className="night-reserve-button">
              Reservar una mesa <ArrowUpRight size={24} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link to="/reservas" className="night-management-link">
              Ver reservas <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="night-footer">
        <div className="footer-top">
          <p>
            Nos vemos
            <br />
            cuando baje el sol.
          </p>
          <div>
            <span>Encontranos</span>
            <p>
              Calle 87 · 271
              <br />
              Necochea, Buenos Aires
            </p>
          </div>
          <Link to="/#inicio" aria-label="Volver al inicio">
            <ArrowUp size={24} strokeWidth={1.2} />
          </Link>
        </div>
        <div className="footer-word" aria-hidden="true">
          BRICKWEEL
        </div>
        <div className="footer-bottom">
          <span>BRICKWEEL · Pub bar & night club</span>
          <span>La noche es nuestra.</span>
          <Link to="/#tragos">Volver a la carta</Link>
        </div>
      </footer>
    </div>
  )
}
