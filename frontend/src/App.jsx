import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { NotificationProvider } from './components/Notifications.jsx'
import { ReservasProvider } from './components/ReservasProvider.jsx'
import { EmptyState } from './components/ui.jsx'
import ReservasPage from './pages/ReservasPage.jsx'
import ReservaFormPage from './pages/ReservaFormPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import {
  AuthProvider,
  RequireAuth,
  RequireStaff,
  RequireAdmin,
} from './components/AuthProvider.jsx'
import EventosPage from './pages/EventosPage.jsx'
import GestionPage from './pages/GestionPage.jsx'
import {
  PerfilPage,
  AvisosPage,
  HistorialPage,
  EntradasPage,
  ReportesPage,
  ConfiguracionPage,
} from './pages/CuentaPage.jsx'
import './styles/negocio.css'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="login" element={<AuthPage key="login" />} />
          <Route path="registro" element={<AuthPage key="registro" register />} />
          <Route
            path="eventos"
            element={
              <NotificationProvider>
                <EventosPage />
              </NotificationProvider>
            }
          />
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
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="avisos" element={<AvisosPage />} />
            <Route path="historial" element={<HistorialPage />} />
            <Route path="entradas" element={<EntradasPage />} />
            <Route
              path="gestion/:tipo"
              element={
                <RequireAdmin>
                  <GestionPage />
                </RequireAdmin>
              }
            />
            <Route
              path="carta-operativa"
              element={
                <RequireStaff>
                  <GestionPage carta />
                </RequireStaff>
              }
            />
            <Route
              path="reportes"
              element={
                <RequireAdmin>
                  <ReportesPage />
                </RequireAdmin>
              }
            />
            <Route
              path="configuracion"
              element={
                <RequireAdmin>
                  <ConfiguracionPage />
                </RequireAdmin>
              }
            />
            <Route
              path="clientes/:id/historial"
              element={
                <RequireAdmin>
                  <HistorialPage />
                </RequireAdmin>
              }
            />
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
