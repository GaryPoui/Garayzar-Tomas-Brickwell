import app from './app.js'
import { recordatorios } from './services/NotificacionService.js'

const PORT = process.env.PORT || 3000

app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`Servidor de Brickell's ejecutándose en http://localhost:${PORT}`)
})
const reminders = setInterval(async () => {
  try {
    await recordatorios()
  } catch (error) {
    console.error('No se pudieron generar los recordatorios.', error)
  }
}, 60000)
reminders.unref()
