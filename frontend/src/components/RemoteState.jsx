import { Button, LoadingState } from './ui.jsx'
export default function RemoteState({ remote, children }) {
  if (remote.loading) return <LoadingState label="Cargando información..." />
  if (remote.error)
    return (
      <div className="inline-error" role="alert">
        <p>{remote.error}</p>
        <Button onClick={remote.refresh}>Reintentar</Button>
      </div>
    )
  return children
}
