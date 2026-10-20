import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, CalendarPlus, ListFilter, Music2 } from 'lucide-react'
import { useReservas } from '../utils/applicationContext.js'
import barImage from '../assets/bar.jpg'

export default function Layout() {
  const { pathname } = useLocation()
  const main = useRef(null)
  const { loading, error } = useReservas()
  useEffect(() => {
    main.current?.focus()
    document.title = `${pathname.includes('nueva') ? 'Nueva reserva' : pathname.includes('editar') ? 'Editar reserva' : pathname.includes('agenda') ? 'Agenda' : 'Reservas'} | Brickell's`
  }, [pathname])

  return (
    <div className="app-layout">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <NavLink to="/reservas" className="brand" aria-label="Brickell's, reservas">
          <span className="brand-name">
            brickell's<span className="brand-dot">.</span>
          </span>
          <span className="brand-caption">PUB BAR & NIGHT CLUB</span>
        </NavLink>
        <div className="sidebar-navigation">
          <p className="nav-caption">ESPACIO DE GESTIÓN</p>
          <nav aria-label="Navegación principal">
            <NavLink to="/reservas" end>
              <ListFilter size={20} aria-hidden="true" />
              <span>Reservas</span>
              <ArrowUpRight className="nav-arrow" size={17} aria-hidden="true" />
            </NavLink>
            <NavLink to="/agenda">
              <CalendarDays size={20} aria-hidden="true" />
              <span>Agenda</span>
              <ArrowUpRight className="nav-arrow" size={17} aria-hidden="true" />
            </NavLink>
            <NavLink to="/reservas/nueva">
              <CalendarPlus size={20} aria-hidden="true" />
              <span>Nueva reserva</span>
              <ArrowUpRight className="nav-arrow" size={17} aria-hidden="true" />
            </NavLink>
          </nav>
        </div>
        <div className="sidebar-visual">
          <img
            src={barImage}
            alt="Interior de un pub con mesas y una barra iluminada; imagen de ambientación."
          />
          <div className="visual-caption">
            <Music2 size={18} aria-hidden="true" />
            <span>La noche empieza acá.</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="venue-monogram">b.</span>
          <div>
            <strong>Brickell's</strong>
            <span>Reservas & experiencias</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="topbar-prefix">BRICKELL'S</span>
            <span className="topbar-divider">/</span>
            <span>Gestión de reservas</span>
          </div>
          <span className={`connection ${error ? 'connection-error' : ''}`} role="status">
            <span />
            {loading ? 'Sincronizando' : error ? 'Sin conexión' : 'API conectada'}
          </span>
        </header>
        <main id="contenido" ref={main} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            BRICKELL'S <span className="footer-dot">·</span> PUB BAR & NIGHT CLUB
          </span>
          <span>Gestión de reservas</span>
        </footer>
      </div>
    </div>
  )
}
