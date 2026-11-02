import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { NotificationProvider } from './components/Notifications.jsx'
import { ReservasProvider } from './components/ReservasProvider.jsx'
import { EmptyState } from './components/ui.jsx'
import ReservasPage from './pages/ReservasPage.jsx'
import ReservaFormPage from './pages/ReservaFormPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import { AuthProvider, RequireAuth, RequireStaff } from './components/AuthProvider.jsx'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="login" element={<AuthPage key="login" />} />
          <Route path="registro" element={<AuthPage key="registro" register />} />
          <Route
            element={
              <RequireAuth>
                <NotificationProvider>
                  <ReservasProvider>
                    <Layout />
                  </ReservasProvider>
                </NotificationProvider>
              </RequireAuth>
            }
          >
            <Route
              path="reservas"
              element={
                <RequireStaff>
                  <ReservasPage key="reservas" />
                </RequireStaff>
              }
            />
            <Route path="agenda" element={<ReservasPage key="agenda" agenda />} />
            <Route path="reservar" element={<ReservaFormPage key="reservar" />} />
            <Route
              path="reservas/nueva"
              element={
                <RequireStaff booking>
                  <ReservaFormPage key="nueva" />
                </RequireStaff>
              }
            />
            <Route
              path="reservas/:id/editar"
              element={
                <RequireStaff>
                  <ReservaFormPage key="editar" />
                </RequireStaff>
              }
            />
            <Route
              path="*"
              element={
                <>
                  <h1>Página no encontrada</h1>
                  <EmptyState
                    title="Esta página no existe"
                    description="La dirección solicitada no está disponible."
                  >
                    <Link className="button button-primary" to="/reservas">
                      Volver a reservas
                    </Link>
                  </EmptyState>
                </>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
