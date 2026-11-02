import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Asterisk,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ListFilter,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../utils/applicationContext.js'
import { useState } from 'react'
import '../styles/auth.css'

export default function Layout() {
  const { user, staff, bookingPath, logout } = useAuth()
  const [logoutBusy, setLogoutBusy] = useState(false)
  const { pathname } = useLocation()
  const main = useRef(null)
  const section =
    pathname.includes('nueva') || pathname === '/reservar'
      ? staff
        ? 'Nueva reserva'
        : 'Reservar'
      : pathname.includes('editar')
        ? 'Editar reserva'
        : pathname.includes('agenda')
          ? 'Agenda'
          : 'Reservas'
  useEffect(() => {
    main.current?.focus({ preventScroll: true })
    document.title = `${section} | BRICKWEEL`
  }, [pathname, section])

  return (
    <div className="app-layout">
      <a
        href="#contenido"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault()
          main.current?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <header className="management-header">
        <NavLink to="/" className="brand" aria-label="BRICKWEEL, volver al inicio" translate="no">
          <span className="brand-name">
            BRICKWEEL
            <Asterisk size={13} aria-hidden="true" />
          </span>
          <span className="brand-caption">Pub bar & night club</span>
        </NavLink>
        <nav className="management-navigation" aria-label="Navegación principal">
          {staff && (
            <NavLink to="/reservas" end>
              <ListFilter size={20} aria-hidden="true" />
              <span>Reservas</span>
            </NavLink>
          )}
          <NavLink to="/agenda">
            <CalendarDays size={20} aria-hidden="true" />
            <span>Agenda</span>
          </NavLink>
          <NavLink to={bookingPath}>
            <CalendarPlus size={20} aria-hidden="true" />
            <span>{staff ? 'Nueva reserva' : 'Reservar'}</span>
          </NavLink>
        </nav>
        <NavLink to="/" className="management-home">
          Volver al sitio <ArrowUpRight size={17} aria-hidden="true" />
        </NavLink>
      </header>
      <div className="workspace">
        <div className="topbar">
          <div className="breadcrumb">
            <span>
              {staff ? (user.rol === 'ADMIN' ? 'Administración' : 'Recepción') : 'Mi cuenta'}
            </span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{section}</strong>
          </div>
          <div className="account-controls">
            <span title={user.nombre}>{user.nombre}</span>
            <button
              type="button"
              className="icon-button"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              disabled={logoutBusy}
              onClick={async () => {
                setLogoutBusy(true)
                try {
                  await logout()
                } catch {
                  setLogoutBusy(false)
                }
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
        <main id="contenido" ref={main} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            BRICKWEEL <span className="footer-dot">/</span> Pub bar & night club
          </span>
          <span>Necochea, Buenos Aires</span>
        </footer>
      </div>
    </div>
  )
}
