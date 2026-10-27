import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { NotificationProvider } from './components/Notifications.jsx'
import { ReservasProvider } from './components/ReservasProvider.jsx'
import { EmptyState } from './components/ui.jsx'
import ReservasPage from './pages/ReservasPage.jsx'
import ReservaFormPage from './pages/ReservaFormPage.jsx'

export default function App() {
  return (
    <HashRouter>
      <NotificationProvider>
        <ReservasProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/reservas" replace />} />
              <Route path="reservas" element={<ReservasPage key="reservas" />} />
              <Route path="agenda" element={<ReservasPage key="agenda" agenda />} />
              <Route path="reservas/nueva" element={<ReservaFormPage key="nueva" />} />
              <Route path="reservas/:id/editar" element={<ReservaFormPage key="editar" />} />
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
        </ReservasProvider>
      </NotificationProvider>
    </HashRouter>
  )
}
