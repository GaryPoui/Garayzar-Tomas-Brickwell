import { useEffect, useEffectEvent, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { IconButton } from './ui.jsx'

import { NotificationContext } from '../utils/applicationContext.js'

function Notification({ item, dismiss }) {
  const onDismiss = useEffectEvent(() => dismiss(item.id))
  useEffect(() => {
    if (item.type === 'error') return
    const timer = setTimeout(onDismiss, 7000)
    return () => clearTimeout(timer)
  }, [item.type])
  const Icon = item.type === 'error' ? CircleAlert : CheckCircle2
  return (
    <div
      className={`notification notification-${item.type}`}
      role={item.type === 'error' ? 'alert' : 'status'}
    >
      <Icon size={21} aria-hidden="true" />
      <div>
        <strong>{item.type === 'error' ? 'No se pudo completar la acción' : 'Listo'}</strong>
        <p>{item.message}</p>
      </div>
      <IconButton label="Cerrar notificación" icon={X} onClick={() => dismiss(item.id)} />
    </div>
  )
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const [container, setContainer] = useState(null)
  function notify(message, type = 'success') {
    setItems((current) =>
      [
        ...current.filter((item) => item.message !== message),
        { id: crypto.randomUUID(), message, type },
      ].slice(-4),
    )
  }
  function dismiss(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }
  return (
    <NotificationContext.Provider value={{ notify, setContainer }}>
      {children}
      {createPortal(
        <aside className="notifications" aria-label="Notificaciones">
          {items.map((item) => (
            <Notification key={item.id} item={item} dismiss={dismiss} />
          ))}
        </aside>,
        container || document.body,
      )}
    </NotificationContext.Provider>
  )
}
