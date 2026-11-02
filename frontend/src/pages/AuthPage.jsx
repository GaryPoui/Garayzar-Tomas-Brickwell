import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../utils/applicationContext.js'
import { Button, Field, LoadingState } from '../components/ui.jsx'
import barPhoto from '../assets/nightlife/club.jpg'
import '../styles/auth.css'

export default function AuthPage({ register = false }) {
  const { user, home, loading, error: sessionError, authenticate, retry } = useAuth()
  const location = useLocation()
  const [values, setValues] = useState({ nombre: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  const form = useRef(null)
  const heading = useRef(null)
  const destination = location.state?.from
  const from =
    typeof destination === 'string' && /^\/(reservas|agenda|reservar)(\/|\?|$)/.test(destination)
      ? destination
      : home

  useEffect(() => {
    document.title = `${register ? 'Crear cuenta' : 'Iniciar sesión'} | BRICKWEEL`
    heading.current?.focus()
  }, [register])

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const failures = {}
    if (register && values.nombre.trim().length < 2) failures.nombre = 'Ingresá tu nombre.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      failures.email = 'Ingresá un email válido.'
    if (!values.password || (register && values.password.length < 10))
      failures.password = register ? 'Usá al menos 10 caracteres.' : 'Ingresá tu contraseña.'
    setErrors(failures)
    if (Object.keys(failures).length) {
      form.current.elements.namedItem(Object.keys(failures)[0])?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      await authenticate(register ? 'registro' : 'login', values)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  if (user) return <Navigate to={from} replace />

  return (
    <div className="auth-page">
      <img className="auth-backdrop" src={barPhoto} alt="" />
      <header className="auth-header">
        <Link className="auth-brand" to="/" translate="no">
          BRICKWEEL
        </Link>
        <Link className="auth-back" to="/">
          <ArrowLeft size={17} /> Volver al sitio
        </Link>
      </header>
      <main className="auth-main">
        <div className="auth-content">
          <span className="auth-eyebrow">TU CUENTA · TU NOCHE</span>
          <h1 ref={heading} tabIndex={-1}>
            {register ? 'Hacete parte.' : 'Qué bueno verte.'}
          </h1>
          <p className="auth-intro">
            {register
              ? 'Tu próxima noche empieza con una cuenta.'
              : 'Entrá a tu cuenta. Tu mesa te espera.'}
          </p>
          {loading ? (
            <LoadingState label="Verificando tu sesión..." />
          ) : sessionError ? (
            <div role="alert">
              <p>{sessionError}</p>
              <Button onClick={retry}>Reintentar</Button>
            </div>
          ) : (
            <>
              <nav className="auth-tabs" aria-label="Acceso a tu cuenta">
                <Link to="/login" state={{ from }} aria-current={!register ? 'page' : undefined}>
                  Iniciar sesión
                </Link>
                <Link to="/registro" state={{ from }} aria-current={register ? 'page' : undefined}>
                  Crear cuenta
                </Link>
              </nav>
              <form ref={form} onSubmit={submit} noValidate aria-busy={busy}>
                <fieldset disabled={busy}>
                  <legend className="sr-only">
                    {register ? 'Crear cuenta' : 'Iniciar sesión'}
                  </legend>
                  {register && (
                    <Field
                      id="nombre"
                      name="nombre"
                      label="Nombre"
                      autoComplete="name"
                      maxLength={80}
                      required
                      value={values.nombre}
                      onChange={change}
                      error={errors.nombre}
                    />
                  )}
                  <Field
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    value={values.email}
                    onChange={change}
                    error={errors.email}
                  />
                  <div className="auth-password">
                    <Field
                      id="password"
                      name="password"
                      label="Contraseña"
                      type={visible ? 'text' : 'password'}
                      autoComplete={register ? 'new-password' : 'current-password'}
                      maxLength={128}
                      required
                      value={values.password}
                      onChange={change}
                      error={errors.password}
                      hint={register ? 'Al menos 10 caracteres.' : undefined}
                    />
                    <button
                      className="auth-reveal icon-button"
                      type="button"
                      title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={visible}
                      onClick={() => setVisible((value) => !value)}
                    >
                      {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {error && (
                    <p className="auth-error" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="submit" icon={register ? UserPlus : LogIn} busy={busy}>
                    {busy ? 'Un momento...' : register ? 'Crear mi cuenta' : 'Entrar'}
                  </Button>
                </fieldset>
              </form>
              <p className="auth-switch">
                {register ? '¿Ya tenés cuenta?' : '¿Primera vez por acá?'}{' '}
                <Link to={register ? '/login' : '/registro'} state={{ from }}>
                  {register ? 'Iniciá sesión' : 'Registrate'} <ArrowUpRight size={15} />
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
      <footer className="auth-footer">
        <span>Pub bar & night club</span>
        <span>Necochea, Buenos Aires</span>
      </footer>
    </div>
  )
}
