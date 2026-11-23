import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useRemote from '../utils/useRemote.js'
import { useAuth, useNotification } from '../utils/applicationContext.js'
import { crearRecurso, guardarRecurso, borrarRecurso } from '../services/negocioService.js'
import { Button, Field, PageHeading } from '../components/ui.jsx'
import RemoteState from '../components/RemoteState.jsx'
import Modal from '../components/Modal.jsx'
import { eventoTransitions } from '../utils/negocio.js'
import { moneda } from '../utils/reservas.js'
import '../styles/negocio.css'

const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra })
const schemas = {
  sectores: {
    title: 'Sectores y mesas',
    path: '/gestion/catalogo/sectores',
    fields: [
      f('nombre', 'Nombre'),
      f('tipo', 'Tipo de mesa'),
      f('cercania', 'Ubicación'),
      f('descripcion', 'Descripción'),
      f('precio', 'Precio por mesa (ARS)', 'number'),
      f('personasPorMesa', 'Personas por mesa', 'number', { min: 1, max: 20, step: 1 }),
      f('disponible', 'Disponible', 'boolean'),
    ],
    initial: { disponible: true, personasPorMesa: 2, precio: 0 },
  },
  paquetes: {
    title: 'Combos de consumición',
    path: '/gestion/catalogo/paquetes',
    fields: [
      f('nombre', 'Nombre'),
      f('descripcion', 'Descripción'),
      f('precio', 'Precio (ARS)', 'number'),
      f('activo', 'Activo', 'boolean'),
      f('imagen', 'Fotografía de ambientación', 'select', { options: ['bar', 'whisky', 'citrus'] }),
    ],
    initial: { activo: true, precio: 0, imagen: 'bar' },
  },
  carta: {
    title: 'Carta de tragos',
    path: '/gestion/catalogo/carta',
    fields: [
      f('name', 'Nombre'),
      f('category', 'Categoría'),
      f('price', 'Precio (ARS)', 'number'),
      f('description', 'Descripción'),
      f('ingredients', 'Ingredientes'),
      f('character', 'Presentación', 'text', { optional: true }),
      f('image', 'Fotografía de ambientación', 'select', { options: ['bar', 'whisky', 'citrus'] }),
      f('disponible', 'Disponible', 'boolean'),
    ],
    initial: { disponible: true, price: 0, image: 'bar' },
  },
  eventos: {
    title: 'Gestión de eventos',
    path: '/gestion/eventos',
    fields: [
      f('nombre', 'Nombre del evento'),
      f('fecha', 'Fecha', 'date'),
      f('horario', 'Horario', 'time'),
      f('descripcion', 'Descripción', 'text', { optional: true, maxLength: 2000 }),
      f('precioEntrada', 'Precio anticipado (ARS)', 'number'),
      f('precioPuerta', 'Precio en puerta (ARS)', 'number'),
      f('capacidadMaxima', 'Capacidad máxima', 'number', { min: 1, max: 100000, step: 1 }),
      f('dj', 'DJ / artista', 'text', { optional: true }),
      f('generoMusical', 'Género musical', 'text', { optional: true }),
      f('dressCode', 'Dress code', 'text', { optional: true }),
      f('promociones', 'Promociones', 'text', { optional: true }),
      f('presenciasEspeciales', 'Presencias especiales', 'text', { optional: true }),
      f('imagen', 'URL HTTPS del flyer', 'url', { optional: true, maxLength: 2000 }),
      f('fotoDj', 'URL HTTPS de la foto del artista', 'url', { optional: true, maxLength: 2000 }),
      f('estado', 'Estado', 'select', { options: ['BORRADOR'] }),
    ],
    initial: {
      estado: 'BORRADOR',
      horario: '23:30',
      precioEntrada: 0,
      precioPuerta: 0,
      capacidadMaxima: 100,
    },
  },
  usuarios: {
    title: 'Usuarios',
    path: '/gestion/usuarios',
    fields: [
      f('nombre', 'Nombre'),
      f('email', 'Email', 'email', { createOnly: true }),
      f('password', 'Contraseña inicial', 'password', { createOnly: true }),
      f('fechaNacimiento', 'Fecha de nacimiento', 'date'),
      f('telefono', 'Teléfono', 'tel'),
      f('rol', 'Rol', 'select', { options: ['CLIENTE', 'RECEPCIONISTA', 'ADMIN'] }),
      f('activo', 'Cuenta activa', 'boolean', { editOnly: true }),
    ],
    initial: { rol: 'CLIENTE', activo: true },
  },
}

function Editor({ schema, original, tipo, onlyAvailability, onClose, onSaved }) {
  const [values, setValues] = useState({ ...schema.initial, ...original })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fields = onlyAvailability
    ? schema.fields.filter((field) => field.key === 'disponible')
    : schema.fields.filter(
        (field) => !(original && field.createOnly) && !(!original && field.editOnly),
      )
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.type === 'number'
          ? Number(values[field.key])
          : field.type === 'boolean'
            ? values[field.key] === true || values[field.key] === 'true'
            : (values[field.key] ?? ''),
      ]),
    )
    try {
      if (original) await guardarRecurso(`${schema.path}/${original.id}`, data)
      else await crearRecurso(schema.path, data)
      onSaved()
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }
  return (
    <Modal
      title={`${original ? 'Editar' : 'Crear'} · ${schema.title}`}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy} className="editor-fields">
          <legend className="sr-only">Datos del registro</legend>
          {fields.map((field) => {
            let options = field.options
            if (tipo === 'eventos' && original && field.key === 'estado')
              options = [original.estado, ...eventoTransitions[original.estado]]
            const props = {
              id: `edit-${field.key}`,
              label: field.label,
              required: !field.optional,
              value: values[field.key] ?? '',
              onChange: (event) =>
                setValues((current) => ({ ...current, [field.key]: event.target.value })),
              maxLength:
                field.maxLength ||
                (['descripcion', 'description', 'ingredients', 'promociones'].includes(field.key)
                  ? 500
                  : 200),
            }
            if (field.type === 'boolean')
              return (
                <Field {...props} key={field.key}>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </Field>
              )
            if (options)
              return (
                <Field {...props} key={field.key}>
                  {options.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </Field>
              )
            return (
              <Field
                {...props}
                key={field.key}
                type={field.type}
                min={field.min ?? (field.type === 'number' ? 0 : undefined)}
                max={field.max}
                step={field.step ?? (field.type === 'number' ? '0.01' : undefined)}
              />
            )
          })}
          {tipo === 'eventos' && (
            <p>
              Completá al menos descripción, DJ, dress code o promoción. El evento se crea como
              borrador; publicalo cuando esté listo.
            </p>
          )}
          {tipo === 'usuarios' && !original && (
            <p>
              La contraseña debe tener al menos 10 caracteres, mayúscula, minúscula y número.
              Teléfono: de 8 a 15 dígitos.
            </p>
          )}
          {tipo === 'sectores' && !original && <p>Se crearán cuatro mesas para este sector.</p>}
        </fieldset>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Volver
          </Button>
          <Button type="submit" busy={busy}>
            Guardar registro
          </Button>
        </footer>
      </form>
    </Modal>
  )
}

export default function GestionPage({ carta = false }) {
  const params = useParams()
  const tipo = carta ? 'carta' : params.tipo
  return <GestionResource key={tipo} tipo={tipo} />
}

function GestionResource({ tipo }) {
  const schema = schemas[tipo]
  const remote = useRemote(schema?.path || null)
  const { admin } = useAuth()
  const notify = useNotification()
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!schema) return <PageHeading title="Sección no encontrada" />
  if (!admin && tipo !== 'carta') return <PageHeading title="Acceso restringido" />
  function saved() {
    setEditing(null)
    remote.refresh()
    notify('El registro se guardó correctamente.')
  }
  async function remove() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await borrarRecurso(`${schema.path}/${toDelete.id}`)
      setToDelete(null)
      remote.refresh()
      notify('El registro se eliminó correctamente.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeading
        title={schema.title}
        description={
          tipo === 'usuarios'
            ? 'Administrá cuentas y permisos. La baja de una cuenta conserva su historial.'
            : 'Los cambios se guardan en el servidor y se reflejan en la aplicación.'
        }
      >
        <Button variant="secondary" onClick={remote.refresh}>
          Actualizar
        </Button>
        {admin && <Button onClick={() => setEditing({ create: true })}>Crear registro</Button>}
      </PageHeading>
      {admin && (
        <nav
          className="extra-navigation management-sections"
          aria-label="Secciones de administración"
        >
          {Object.entries(schemas).map(([key, value]) => (
            <Link key={key} to={`/gestion/${key}`} aria-current={tipo === key ? 'page' : undefined}>
              {value.title}
            </Link>
          ))}
          <Link to="/reportes">Reportes e historial de clientes</Link>
        </nav>
      )}
      <RemoteState remote={remote}>
        <div className="business-grid">
          {(remote.data || []).map((item) => (
            <article className="business-card" key={item.id}>
              <p>
                #{item.id}
                {item.estado ? ` · ${item.estado}` : ''}
              </p>
              <h2>{item.nombre || item.name}</h2>
              <p>{item.descripcion || item.description || item.email}</p>
              {tipo === 'usuarios' && (
                <p>
                  {item.rol} · {item.activo ? 'Cuenta activa' : 'Cuenta desactivada'}
                </p>
              )}
              {tipo === 'eventos' && (
                <p>
                  {item.fecha} · {item.horario} h · {item.entradasDisponibles} entradas disponibles
                </p>
              )}
              {(item.precio !== undefined || item.price !== undefined) && (
                <p>{moneda(item.precio ?? item.price)}</p>
              )}
              {['carta', 'sectores', 'paquetes'].includes(tipo) && (
                <p>{(item.disponible ?? item.activo) ? 'Disponible' : 'No disponible'}</p>
              )}
              <div className="business-actions">
                {!(tipo === 'eventos' && ['FINALIZADO', 'CANCELADO'].includes(item.estado)) && (
                  <Button variant="secondary" onClick={() => setEditing(item)}>
                    {admin ? 'Editar' : 'Cambiar disponibilidad'}
                    <span className="sr-only"> {item.nombre || item.name}</span>
                  </Button>
                )}
                {admin && tipo !== 'usuarios' && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setToDelete(item)
                      setError('')
                    }}
                  >
                    Eliminar<span className="sr-only"> {item.nombre || item.name}</span>
                  </Button>
                )}
                {tipo === 'usuarios' && item.rol === 'CLIENTE' && (
                  <Link className="button button-secondary" to={`/clientes/${item.id}/historial`}>
                    Ver historial
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
        {remote.data?.length === 0 && <p>No hay registros en esta sección.</p>}
      </RemoteState>
      {editing && (
        <Editor
          schema={schema}
          tipo={tipo}
          original={editing.create ? null : editing}
          onlyAvailability={!admin}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {toDelete && (
        <Modal title="Eliminar registro" onClose={() => setToDelete(null)} busy={busy}>
          <p>
            ¿Eliminar {toDelete.nombre || toDelete.name}? El servidor impedirá eliminar registros
            que deban conservarse por su historial.
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <footer className="modal-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setToDelete(null)}
              data-autofocus
            >
              Conservar registro
            </Button>
            <Button variant="danger" busy={busy} onClick={remove}>
              Confirmar eliminación
            </Button>
          </footer>
        </Modal>
      )}
    </>
  )
}
