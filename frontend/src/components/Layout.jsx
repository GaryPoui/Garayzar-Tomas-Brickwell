import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CalendarDays, CalendarPlus, ChevronRight, ListFilter, MapPin, Wine } from 'lucide-react'

export default function Layout() {
  const { pathname } = useLocation()
  const main = useRef(null)
  const section = pathname.includes('nueva')
    ? 'Nueva reserva'
    : pathname.includes('editar')
      ? 'Editar reserva'
      : pathname.includes('agenda')
        ? 'Agenda'
        : 'Reservas'
  useEffect(() => {
    main.current?.focus({ preventScroll: true })
    document.title = `${section} | Brickell's`
  }, [pathname, section])

  return (
    <div className="app-layout">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <NavLink to="/reservas" className="brand" aria-label="Brickell's, reservas" translate="no">
          <Wine size={25} strokeWidth={1.3} aria-hidden="true" />
          <span className="brand-name">Brickell’s</span>
          <span className="brand-caption">Pub bar & night club</span>
        </NavLink>
        <div className="sidebar-navigation">
          <p className="nav-caption">Gestión del local</p>
          <nav aria-label="Navegación principal">
            <NavLink to="/reservas" end>
              <ListFilter size={20} aria-hidden="true" />
              <span>Reservas</span>
              <ChevronRight className="nav-arrow" size={16} aria-hidden="true" />
            </NavLink>
            <NavLink to="/agenda">
              <CalendarDays size={20} aria-hidden="true" />
              <span>Agenda</span>
              <ChevronRight className="nav-arrow" size={16} aria-hidden="true" />
            </NavLink>
            <NavLink to="/reservas/nueva">
              <CalendarPlus size={20} aria-hidden="true" />
              <span>Nueva reserva</span>
              <ChevronRight className="nav-arrow" size={16} aria-hidden="true" />
            </NavLink>
          </nav>
        </div>
        <div className="sidebar-footer">
          <MapPin size={18} aria-hidden="true" />
          <div>
            <strong>Necochea</strong>
            <span>Calle 87 · 271</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Gestión del local</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{section}</strong>
          </div>
          <span className="topbar-location">Brickell’s / Necochea</span>
        </header>
        <main id="contenido" ref={main} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            Brickell’s <span className="footer-dot">/</span> Pub bar & night club
          </span>
          <span>Necochea, Buenos Aires</span>
        </footer>
      </div>
    </div>
  )
}
