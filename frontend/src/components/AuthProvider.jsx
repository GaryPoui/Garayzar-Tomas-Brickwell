import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext, useAuth } from '../utils/applicationContext.js'
import { requestApi, sessionToken } from '../services/apiClient.js'
import { Button, LoadingState } from './ui.jsx'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(sessionToken()))
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    function expire() {
      sessionStorage.removeItem('brickwell-session')
      setUser(null)
      setError('')
      setLoading(false)
    }
    window.addEventListener('brickwell-session-expired', expire)
    const controller = new AbortController()
    if (sessionToken()) {
      requestApi('/auth/sesion', { signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted) setUser(data)
        })
        .catch((failure) => {
          if (!controller.signal.aborted && failure.status !== 401) setError(failure.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }
    return () => {
      controller.abort()
      window.removeEventListener('brickwell-session-expired', expire)
    }
  }, [revision])

  async function authenticate(mode, values) {
    const data = await requestApi(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) })
    sessionStorage.setItem('brickwell-session', data.token)
    setUser(data.user)
    setError('')
  }

  async function logout() {
    try {
      await requestApi('/auth/logout', { method: 'POST' })
    } finally {
      sessionStorage.removeItem('brickwell-session')
      setUser(null)
    }
  }

  function retry() {
    setLoading(true)
    setError('')
    setRevision((value) => value + 1)
  }

  const staff = ['ADMIN', 'RECEPCIONISTA'].includes(user?.rol)
  const home = staff ? '/reservas' : '/agenda'
  const bookingPath = staff ? '/reservas/nueva' : '/reservar'

  return (
    <AuthContext.Provider
      value={{ user, staff, home, bookingPath, loading, error, authenticate, logout, retry }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function RequireAuth({ children }) {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Verificando tu sesión..." />
  if (error)
    return (
      <div className="session-error" role="alert">
        <p>{error}</p>
        <Button onClick={retry}>Reintentar</Button>
      </div>
    )
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  return children
}

export function RequireStaff({ children, booking = false }) {
  const { staff, home, bookingPath } = useAuth()
  const location = useLocation()
  return staff ? (
    children
  ) : (
    <Navigate to={`${booking ? bookingPath : home}${location.search}`} replace />
  )
}
