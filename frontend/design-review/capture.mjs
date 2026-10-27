// Capturas de la aplicación en ejecución. No crea ni modifica reservas.
// Desde frontend: node design-review/capture.mjs
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ locale: 'es-AR' })
  for (const [name, route] of [
    ['reservas', '/reservas'],
    ['agenda', '/agenda'],
    ['formulario', '/reservas/nueva'],
  ]) {
    for (const [size, width] of [['desktop', 1440], ['mobile', 390]]) {
      await page.setViewportSize({ width, height: size === 'desktop' ? 1000 : 844 })
      await page.goto(`http://localhost:5173/Garayzar-Tomas-Brickwell/#${route}`, { waitUntil: 'networkidle' })
      await page.screenshot({ path: `design-review/${name}-${size}.png`, fullPage: true })
    }
  }
} finally {
  await browser.close()
}
