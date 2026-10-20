import { useContext, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './ui.jsx'
import { NotificationContext } from '../utils/applicationContext.js'

export default function Modal({ title, children, onClose, busy = false, className = '' }) {
  const dialog = useRef(null)
  const titleId = useId()
  const { setContainer } = useContext(NotificationContext)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    setContainer(element)
    element.querySelector('[data-autofocus]')?.focus()
    return () => {
      element.close()
      setContainer(null)
      if (previous?.isConnected) previous.focus()
      else document.querySelector('main')?.focus()
    }
  }, [setContainer])

  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          if (!busy) onClose()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div className="modal-content">
        <header className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Cerrar ventana" icon={X} disabled={busy} onClick={onClose} />
        </header>
        {children}
      </div>
    </dialog>
  )
}
