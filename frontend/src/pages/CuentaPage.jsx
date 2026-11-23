import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useRemote from '../utils/useRemote.js'
import { useAuth, useNotification } from '../utils/applicationContext.js'
import { guardarRecurso } from '../services/negocioService.js'
import { Button, Field, PageHeading } from '../components/ui.jsx'
import RemoteState from '../components/RemoteState.jsx'
import Modal from '../components/Modal.jsx'
import { moneda, fechaLegible } from '../utils/reservas.js'
import { validarPerfil } from '../utils/negocio.js'
import '../styles/negocio.css'

export function PerfilPage() {
  const { user, updateProfile } = useAuth()
  const [values, setValues] = useState({
    nombre: user.nombre,
    fechaNacimiento: user.fechaNacimiento || '',
    telefono: user.telefono || '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const notify = useNotification()
  async function save(event) {
    event.preventDefault()
    const failures = validarPerfil(values)
    setErrors(failures)
    if (Object.keys(failures).length || busy) return
    setBusy(true)
    setError('')
    try {
      const user = await guardarRecurso('/perfil', values)
      updateProfile(user)
      notify('Tu perfil se actualizó correctamente.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading title="Mi perfil" description="Mantené tus datos de contacto actualizados." />
      <form className="business-form" onSubmit={save}>
        <fieldset disabled={busy}>
          <legend className="sr-only">Datos personales</legend>
          {[
            ['nombre', 'Nombre', 'text'],
            ['fechaNacimiento', 'Fecha de nacimiento', 'date'],
            ['telefono', 'Teléfono', 'tel'],
          ].map(([key, label, type]) => (
            <Field
              key={key}
              id={key}
              label={label}
              type={type}
              required
              value={values[key]}
              error={errors[key]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          ))}
          <p>Email: {user.email}</p>
        </fieldset>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <Button type="submit" busy={busy}>
          Guardar perfil
        </Button>
      </form>
    </>
  )
}

export function AvisosPage() {
  const remote = useRemote('/avisos')
  const notify = useNotification()
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    const timer = setInterval(remote.refresh, 30000)
    return () => clearInterval(timer)
  }, [remote.refresh])
  async function read(id) {
    if (busy) return
    setBusy(id)
    try {
      await guardarRecurso(`/avisos/${id}`, {})
      remote.refresh()
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setBusy(null)
    }
  }
  return (
    <>
      <PageHeading
        title="Mis avisos"
        description="Confirmaciones, cancelaciones y recordatorios. Se actualizan cada 30 segundos mientras esta pantalla está abierta."
      >
        <Button onClick={remote.refresh}>Actualizar avisos</Button>
      </PageHeading>
      <RemoteState remote={remote}>
        {!remote.data?.length && <p>No tenés avisos por el momento.</p>}
        <div className="business-grid">
          {(remote.data || []).map((item) => (
            <article className="business-card" key={item.id}>
              <p>{new Date(item.fecha).toLocaleString('es-AR')}</p>
              <h2>{item.leida ? 'Leído' : 'Nuevo aviso'}</h2>
              <p>{item.mensaje}</p>
              {!item.leida && (
                <Button variant="secondary" busy={busy === item.id} onClick={() => read(item.id)}>
                  Marcar como leído<span className="sr-only"> aviso #{item.id}</span>
                </Button>
              )}
            </article>
          ))}
        </div>
      </RemoteState>
    </>
  )
}

export function HistorialPage() {
  const { id } = useParams()
  const remote = useRemote(id ? `/clientes/${id}/historial` : '/historial')
  return (
    <>
      <PageHeading
        title={id ? 'Historial del cliente' : 'Mi historial'}
        description="Reservas, combos solicitados y entradas. Los registros cerrados se conservan para consulta."
      />
      <RemoteState remote={remote}>
        <h2>{remote.data?.usuario.nombre}</h2>
        <h2>Reservas y consumiciones reservadas</h2>
        {!remote.data?.reservas.length && <p>No hay reservas registradas.</p>}
        <div className="business-grid">
          {(remote.data?.reservas || []).map((item) => (
            <article className="business-card" key={item.id}>
              <h3>
                Reserva #{item.id} · {item.estado}
              </h3>
              <p>
                {fechaLegible(item.fecha)} · {item.horario} h
              </p>
              <p>
                {item.detalleMesa?.sectorNombre} · Mesa {item.detalleMesa?.nombre}
              </p>
              {item.combos.map((combo) => (
                <p key={combo.id}>
                  {combo.cantidad} × {combo.nombre}
                </p>
              ))}
              <p>
                Total {moneda(item.precioTotal)} · Anticipo {moneda(item.anticipo)}
              </p>
            </article>
          ))}
        </div>
        <h2>Eventos y entradas</h2>
        {!remote.data?.entradas.length && <p>No hay entradas registradas.</p>}
        <div className="business-grid">
          {(remote.data?.entradas || []).map((item) => (
            <article className="business-card" key={item.id}>
              <h3>
                {item.detalleEvento?.nombre} · Entrada #{item.id}
              </h3>
              <p>{item.estado === 'USADA' ? 'Asistencia registrada' : item.estado}</p>
              <p>{moneda(item.precio)}</p>
            </article>
          ))}
        </div>
      </RemoteState>
    </>
  )
}

export function EntradasPage() {
  const remote = useRemote('/entradas')
  const { staff } = useAuth()
  const notify = useNotification()
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await guardarRecurso(`/entradas/${action.item.id}`, { estado: action.estado })
      setAction(null)
      remote.refresh()
      notify('La entrada se actualizó correctamente.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading
        title={staff ? 'Gestión de entradas' : 'Mis entradas'}
        description="El pago se coordina con el local. Solo las entradas confirmadas habilitan el ingreso."
      >
        <Button onClick={remote.refresh}>Actualizar entradas</Button>
      </PageHeading>
      {staff && (
        <Field
          id="buscar-entrada"
          label="Buscar por código, número o cliente"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <RemoteState remote={remote}>
        {!remote.data?.length && <p>No hay entradas registradas.</p>}
        <div className="business-grid">
          {(remote.data || [])
            .filter((item) => `${item.id} ${item.codigo} ${item.cliente}`.includes(search.trim()))
            .map((item) => (
              <article className="business-card" key={item.id}>
                <h2>{item.detalleEvento.nombre}</h2>
                <p>
                  Entrada #{item.id} · {item.estado.replaceAll('_', ' ')}
                </p>
                <p>
                  {fechaLegible(item.detalleEvento.fecha)} · {item.detalleEvento.horario} h
                </p>
                <p>{moneda(item.precio)}</p>
                <p className="ticket-code">Código: {item.codigo}</p>
                {staff && <p>Cliente #{item.cliente}</p>}
                <div className="business-actions">
                  {(staff
                    ? item.estado === 'PENDIENTE_PAGO'
                      ? [
                          ['CONFIRMADA', 'Acreditar pago'],
                          ['CANCELADA', 'Cancelar entrada'],
                        ]
                      : item.estado === 'CONFIRMADA'
                        ? [
                            ['USADA', 'Registrar ingreso'],
                            ['CANCELADA', 'Cancelar entrada'],
                          ]
                        : []
                    : ['PENDIENTE_PAGO', 'CONFIRMADA'].includes(item.estado)
                      ? [['CANCELADA', 'Cancelar entrada']]
                      : []
                  ).map(([estado, label]) => (
                    <Button
                      variant="secondary"
                      key={estado}
                      onClick={() => {
                        setAction({ item, estado, label })
                        setError('')
                      }}
                    >
                      {label}
                      <span className="sr-only"> #{item.id}</span>
                    </Button>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </RemoteState>
      {action && (
        <Modal title={action.label} onClose={() => setAction(null)} busy={busy}>
          <p>
            ¿{action.label} para la entrada #{action.item.id} de {action.item.detalleEvento.nombre}?
          </p>
          {action.estado === 'CONFIRMADA' && (
            <p>Confirmá únicamente si el local recibió {moneda(action.item.precio)}.</p>
          )}
          {action.estado === 'CANCELADA' && (
            <p>Cualquier reembolso se coordina con el local. El cupo se liberará al confirmar.</p>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <footer className="modal-actions">
            <Button
              onClick={() => setAction(null)}
              variant="secondary"
              disabled={busy}
              data-autofocus
            >
              Volver
            </Button>
            <Button busy={busy} onClick={save}>
              Confirmar operación
            </Button>
          </footer>
        </Modal>
      )}
    </>
  )
}

export function ReportesPage() {
  const remote = useRemote('/gestion/reportes')
  return (
    <>
      <PageHeading
        title="Reportes del negocio"
        description="Importes registrados por el personal e historial de clientes. Los saldos pendientes no representan dinero cobrado."
      />
      <RemoteState remote={remote}>
        <div className="business-grid">
          {[
            ['Reservas registradas', remote.data?.reservas],
            ['Anticipos de reservas no canceladas', moneda(remote.data?.anticipos)],
            ['Entradas con pago acreditado', moneda(remote.data?.ventasEntradas)],
            ['Saldo pendiente de reservas', moneda(remote.data?.pendientesReservas)],
          ].map(([label, value]) => (
            <article key={label} className="business-card">
              <h2>{label}</h2>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        <h2>Clientes y visitas</h2>
        <div className="business-grid">
          {(remote.data?.clientes || []).map((item) => (
            <article key={item.id} className="business-card">
              <h3>{item.nombre}</h3>
              <p>
                {item.reservas} reservas · {item.visitas} visitas con mesa · {item.eventosAsistidos}{' '}
                eventos asistidos
              </p>
              <a className="button button-secondary" href={`#/clientes/${item.id}/historial`}>
                Ver historial
              </a>
            </article>
          ))}
        </div>
      </RemoteState>
    </>
  )
}

function PolicyForm({ policy }) {
  const [values, setValues] = useState(policy)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notify = useNotification()
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await guardarRecurso('/gestion/configuracion', {
        cancelacionHoras: Number(values.cancelacionHoras),
        reembolsos: values.reembolsos,
      })
      notify('La política de cancelación se actualizó.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="business-form" onSubmit={save}>
      <fieldset disabled={busy}>
        <legend className="sr-only">Política de cancelación</legend>
        <Field
          id="cancelacionHoras"
          label="Horas mínimas de anticipación para cancelar una mesa"
          type="number"
          min="2"
          max="168"
          step="1"
          required
          value={values.cancelacionHoras}
          onChange={(event) =>
            setValues((current) => ({ ...current, cancelacionHoras: event.target.value }))
          }
          hint="El mínimo es de dos horas. El servidor aplica esta política al cancelar."
        />
        <Field
          id="reembolsos"
          label="Política de reembolsos"
          minLength={10}
          maxLength={1000}
          required
          value={values.reembolsos}
          onChange={(event) =>
            setValues((current) => ({ ...current, reembolsos: event.target.value }))
          }
        />
      </fieldset>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" busy={busy}>
        Guardar política
      </Button>
    </form>
  )
}

export function ConfiguracionPage() {
  const remote = useRemote('/configuracion')
  return (
    <>
      <PageHeading
        title="Políticas de cancelación"
        description="Administrá la anticipación requerida y la información de reembolsos que verá el cliente."
      />
      <RemoteState remote={remote}>
        {remote.data && <PolicyForm policy={remote.data} />}
      </RemoteState>
    </>
  )
}
