import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fechaMinima } from '../utils/reservas.js'

const reservaValida = () => ({
  fecha: fechaMinima(),
  horario: '23:30',
  cliente: 1,
  sector: 2,
  paquete: 1,
  precioTotal: 50000,
  anticipo: 15000,
})

async function createReserva(request, overrides = {}) {
  const response = await request.post('/api/reservas', {
    data: { ...reservaValida(), ...overrides },
  })
  expect(response.ok()).toBeTruthy()
  return (await response.json()).data
}

async function checkAccessibility(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map(({ id, nodes }) => ({ id, elements: nodes.map((node) => node.target) })),
  ).toEqual([])
}

test.afterEach(async ({ request }) => {
  const response = await request.get('/api/reservas')
  const { data } = await response.json()
  for (const reserva of data) await request.delete(`/api/reservas/${reserva.id}`)
})

test('CRUD real, validaciones, filtros, agenda y confirmación accesible', async ({
  page,
  request,
}) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('#/reservas')
  await expect(page.locator('.app-layout')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('.management-navigation')).toBeVisible()
  await expect(page.getByText('Todavía no hay reservas registradas.')).toBeVisible()
  await page.getByRole('link', { name: 'Crear primera reserva' }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(7)
  await expect(page.locator('#fecha')).toBeFocused()
  await expect(page.getByRole('alert')).toContainText('Revisá los campos')
  for (const [name, value] of Object.entries(reservaValida()))
    await page.locator(`#${name}`).fill(String(value))
  await expect(page.locator('.summary-references dd')).toHaveText(['#1', '#2', '#1'])
  await expect(page.locator('.summary-visual img')).toBeVisible()
  await expect
    .poll(() => page.locator('.summary-visual img').evaluate((image) => image.naturalWidth))
    .toBeGreaterThan(0)
  await expect(page.locator('.summary-balance')).toContainText('35.000,00')
  await page.locator('#anticipo').fill('60000')
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('#anticipo-error')).toContainText('no puede superar')
  await page.locator('#anticipo').fill('15000')
  await page.getByRole('button', { name: 'Cerrar notificación' }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  const { data } = await (await request.get('/api/reservas')).json()
  const id = data[0].id
  await expect(page.getByText(`La reserva #${id} se creó correctamente.`)).toBeVisible()
  await expect(page.locator('.notification')).toHaveCSS('background-color', 'rgb(20, 20, 22)')
  await page.getByRole('button', { name: `Ver reserva #${id}`, exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('35.000,00')
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(20, 20, 22)')
  await checkAccessibility(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: `Ver reserva #${id}`, exact: true })).toBeFocused()
  await page.getByRole('link', { name: `Editar reserva #${id}`, exact: true }).click()
  await page.locator('#estado').selectOption('CONFIRMADA')
  await page.locator('#anticipo').fill('20000')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('.reservation-row')).toContainText('Confirmada')
  await page.locator('#filtro-estado').selectOption('CANCELADA')
  await expect(page.getByRole('heading', { name: 'No hay coincidencias' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click()
  await page.getByRole('link', { name: 'Agenda', exact: true }).click()
  await expect(page.locator('.agenda-group')).toHaveCount(1)
  await page.getByRole('button', { name: `Eliminar reserva #${id}`, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Conservar reserva' })).toBeFocused()
  await page.getByRole('button', { name: 'Conservar reserva' }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  await page.getByRole('button', { name: `Eliminar reserva #${id}`, exact: true }).click()
  await page.getByRole('button', { name: 'Eliminar reserva', exact: true }).click()
  await expect(page.getByText('No hay reservas próximas registradas.')).toBeVisible()
  expect((await (await request.get('/api/reservas')).json()).data).toHaveLength(0)
  expect(pageErrors).toEqual([])
})

test('carga, error de API y reintento sin inventar datos', async ({ page }) => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/reservas', async (route) => {
    await gate
    await route.fulfill({
      status: 503,
      json: { success: false, message: 'Servicio temporalmente no disponible.' },
    })
  })
  await page.goto('#/reservas')
  await expect(page.getByText('Cargando reservas...')).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('Servicio temporalmente no disponible.')
  await expect(page.locator('.reservation-row')).toHaveCount(0)
  await page.unroute('**/api/reservas')
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await expect(page.getByText('Todavía no hay reservas registradas.')).toBeVisible()
})

test('error de eliminación visible dentro del diálogo y recuperación', async ({
  page,
  request,
}) => {
  const reserva = await createReserva(request)
  await page.goto('#/reservas')
  await page.getByRole('button', { name: `Eliminar reserva #${reserva.id}`, exact: true }).click()
  await page.route(`**/api/reservas/${reserva.id}`, async (route) => {
    if (route.request().method() !== 'DELETE') return route.continue()
    await route.fulfill({
      status: 500,
      json: { success: false, message: 'No se pudo eliminar la reserva.' },
    })
  })
  await page.getByRole('button', { name: 'Eliminar reserva', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'No se pudo eliminar la reserva.',
  )
  await page.getByRole('button', { name: 'Cerrar notificación' }).click()
  await page.unroute(`**/api/reservas/${reserva.id}`)
  await page.getByRole('button', { name: 'Eliminar reserva', exact: true }).click()
  await expect(page.getByText('Todavía no hay reservas registradas.')).toBeVisible()
})

test('paginación, filtros y disposición sin desbordes en móvil y escritorio', async ({
  page,
  request,
}, testInfo) => {
  const states = ['PENDIENTE', 'CONFIRMADA', 'ACTIVA', 'FINALIZADA', 'CANCELADA']
  for (let index = 1; index <= 9; index++) {
    const reserva = await createReserva(request, { cliente: index })
    const response = await request.put(`/api/reservas/${reserva.id}`, {
      data: { estado: states[(index - 1) % states.length] },
    })
    expect(response.ok()).toBeTruthy()
  }
  await page.goto('#/reservas')
  await expect(page.locator('.reservation-row')).toHaveCount(8)
  await checkAccessibility(page)
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Página anterior' }).click()
  await page.locator('#buscar').fill('inexistente')
  await expect(page.getByRole('heading', { name: 'No hay coincidencias' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click()
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible()
    await expect(page.locator('.reservation-row')).toHaveCount(8)
    await page.screenshot({ path: testInfo.outputPath(`reservas-${width}.png`), fullPage: true })
    await page.getByRole('link', { name: 'Agenda', exact: true }).click()
    await expect(page.locator('.agenda-group')).toHaveCount(1)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath(`agenda-${width}.png`), fullPage: true })
    await page.getByRole('link', { name: 'Nueva reserva', exact: true }).first().click()
    await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(7)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await page.getByRole('button', { name: 'Cerrar notificación' }).click()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: testInfo.outputPath(`formulario-errores-${width}.png`),
      fullPage: true,
    })
    await page.getByRole('link', { name: 'Reservas', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible()
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await checkAccessibility(page)
  await page.getByRole('link', { name: 'Nueva reserva', exact: true }).first().click()
  await expect(page.locator('#fecha')).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy()
  await page.screenshot({ path: testInfo.outputPath('formulario-mobile.png'), fullPage: true })
})

test('accesibilidad del listado vacío y formulario con errores', async ({ page }, testInfo) => {
  await page.goto('#/reservas')
  await expect(page.getByText('Todavía no hay reservas registradas.')).toBeVisible()
  await checkAccessibility(page)
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await page.screenshot({ path: testInfo.outputPath(`vacio-${width}.png`), fullPage: true })
  }
  await page.getByRole('link', { name: 'Crear primera reserva' }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await checkAccessibility(page)
})

test('cambiar de reserva por el historial recarga el formulario correcto', async ({
  page,
  request,
}) => {
  const first = await createReserva(request, { cliente: 11 })
  const second = await createReserva(request, { cliente: 22 })
  await page.goto(`#/reservas/${first.id}/editar`)
  await expect(page.locator('#cliente')).toHaveValue('11')
  await page.getByRole('link', { name: 'Volver a reservas' }).click()
  await page.getByRole('link', { name: `Editar reserva #${second.id}` }).click()
  await expect(page.locator('#cliente')).toHaveValue('22')
  await page.goBack()
  await page.goBack()
  await expect(page.locator('#cliente')).toHaveValue('11')
})
