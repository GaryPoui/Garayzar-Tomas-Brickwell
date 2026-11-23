import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fechaMinima } from '../utils/reservas.js'

const credentials = { email: 'admin-e2e@example.com', password: 'Admin-e2e-testing-123' }
async function session(request, email = credentials.email, password = credentials.password) {
  const response = await request.post('/api/auth/login', { data: { email, password } })
  expect(response.status()).toBe(200)
  return (await response.json()).data
}
async function asUser(page, token) {
  await page.addInitScript((value) => sessionStorage.setItem('brickwell-session', value), token)
}
async function client(request, admin, suffix) {
  const response = await request.post('/api/gestion/usuarios', {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: {
      nombre: `Cliente ${suffix}`,
      email: `${suffix}-${Date.now()}@example.com`,
      password: 'Cliente-testing-123',
      fechaNacimiento: '2000-01-01',
      telefono: '2262551234',
      rol: 'CLIENTE',
    },
  })
  expect(response.status()).toBe(201)
  const user = (await response.json()).data
  return session(request, user.email, 'Cliente-testing-123')
}
async function saveEditor(page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Guardar registro', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
async function accessible(page) {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(
    audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
  ).toEqual([])
}

test('cliente se registra con validación de edad, reserva, cancela y conserva su historial', async ({
  page,
  request,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('#/registro')
  await page.locator('#nombre').fill('Cliente cancelación')
  await page.locator('#email').fill(`cancelacion-${Date.now()}@example.com`)
  await page.locator('#password').fill('Cliente-testing-123')
  await page.locator('#fechaNacimiento').fill('2020-01-01')
  await page.locator('#telefono').fill('2262551234')
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await expect(page.locator('#fechaNacimiento-error')).toContainText('16')
  await page.locator('#fechaNacimiento').fill('2000-01-01')
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await expect(page).toHaveURL(/#\/agenda$/)
  await page
    .locator('.management-navigation')
    .getByRole('link', { name: 'Reservar', exact: true })
    .click()
  await expect(page.locator('#anticipo')).toHaveCount(0)
  await expect(page.locator('#descuento')).toHaveCount(0)
  await page.getByRole('button', { name: /^Mesa V3,/ }).click()
  await page.getByRole('button', { name: 'Agregar Gin + tónicas' }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  const token = await page.evaluate(() => sessionStorage.getItem('brickwell-session'))
  const reservations = (
    await (
      await request.get('/api/reservas', { headers: { Authorization: `Bearer ${token}` } })
    ).json()
  ).data
  const id = reservations[0].id
  await page.getByRole('button', { name: `Cancelar reserva #${id}`, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Conservar reserva', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Confirmar cancelación' }).click()
  await expect(page.locator('.reservation-row')).toContainText('Cancelada')
  await page.reload()
  await expect(page.locator('.reservation-row')).toContainText('Cancelada')
  const catalog = (await (await request.get(`/api/catalogo?fecha=${fechaMinima()}`)).json()).data
  expect(catalog.mesas.find((item) => item.id === 3).disponible).toBe(true)
  await page.getByRole('link', { name: 'Mi historial', exact: true }).click()
  await expect(page.locator('main')).toContainText('Gin + tónicas')
  await page.getByRole('link', { name: 'Mis avisos', exact: true }).click()
  await expect(page.locator('main')).toContainText(`Cancelaste la reserva #${id}`)
  await accessible(page)
  expect(errors).toEqual([])
  const admin = await session(request)
  await request.delete(`/api/reservas/${id}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
})

test('administración crea usuarios y sectores; catálogo y disponibilidad se reflejan en la web', async ({
  page,
  request,
  browser,
  baseURL,
}, testInfo) => {
  const admin = await session(request)
  await asUser(page, admin.token)
  const suffix = String(Date.now())
  await page.goto('#/gestion/usuarios')
  await page.getByRole('button', { name: 'Crear registro', exact: true }).click()
  for (const [key, value] of Object.entries({
    nombre: 'Recepción nueva',
    email: `recepcion-${suffix}@example.com`,
    password: 'Recepcion-testing-123',
    fechaNacimiento: '1990-01-01',
    telefono: '2262554321',
  }))
    await page.locator(`#edit-${key}`).fill(value)
  await page.locator('#edit-rol').selectOption('RECEPCIONISTA')
  await saveEditor(page)
  await expect(
    page.locator('.business-card').filter({ hasText: `recepcion-${suffix}@example.com` }),
  ).toContainText('RECEPCIONISTA')
  await page.goto('#/gestion/sectores')
  await page.getByRole('button', { name: 'Crear registro', exact: true }).click()
  for (const [key, value] of Object.entries({
    nombre: `Terraza ${suffix}`,
    tipo: 'Mesa exterior',
    cercania: 'Exterior',
    descripcion: 'Mesas al aire libre',
    precio: '25000',
    personasPorMesa: '3',
  }))
    await page.locator(`#edit-${key}`).fill(value)
  await saveEditor(page)
  const sectorCard = page
    .locator('.business-card')
    .filter({ has: page.getByRole('heading', { name: `Terraza ${suffix}`, exact: true }) })
  await expect(sectorCard).toBeVisible()
  const catalog = (await (await request.get('/api/catalogo')).json()).data
  const sector = catalog.sectores.find((item) => item.nombre === `Terraza ${suffix}`)
  expect(catalog.mesas.filter((item) => item.sector === sector.id)).toHaveLength(4)
  await sectorCard.getByRole('button', { name: `Eliminar Terraza ${suffix}`, exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar eliminación', exact: true }).click()
  await expect(sectorCard).toHaveCount(0)
  await page.goto('#/gestion/paquetes')
  await page.getByRole('button', { name: 'Editar Gin + tónicas', exact: true }).click()
  await page.locator('#edit-precio').fill('46000')
  await saveEditor(page)
  expect(
    (await (await request.get('/api/carta')).json()).data.find((item) => item.id === 'combo-5')
      .price,
  ).toBe(46000)
  // Restore the reference tariff for the independent booking tests.
  await page.getByRole('button', { name: 'Editar Gin + tónicas', exact: true }).click()
  await page.locator('#edit-precio').fill('45000')
  await saveEditor(page)
  const reception = await session(
    request,
    `recepcion-${suffix}@example.com`,
    'Recepcion-testing-123',
  )
  const context = await browser.newContext({ baseURL })
  const staff = await context.newPage()
  await asUser(staff, reception.token)
  try {
    await staff.goto('#/carta-operativa')
    await expect(staff.getByRole('link', { name: 'Administrar negocio' })).toHaveCount(0)
    await staff.getByRole('button', { name: 'Cambiar disponibilidad Mojito', exact: true }).click()
    await staff.locator('#edit-disponible').selectOption('false')
    await saveEditor(staff)
    expect(
      (await (await request.get('/api/carta')).json()).data.some((item) => item.name === 'Mojito'),
    ).toBe(false)
    await staff.getByRole('button', { name: 'Cambiar disponibilidad Mojito', exact: true }).click()
    await staff.locator('#edit-disponible').selectOption('true')
    await saveEditor(staff)
  } finally {
    await context.close()
  }
  await page.goto('#/gestion/carta')
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`gestion-${width}.png`), fullPage: true })
  }
  await accessible(page)
})

test('perfil y política de cancelación se guardan y conservan al recargar', async ({
  page,
  request,
  browser,
  baseURL,
}) => {
  const admin = await session(request)
  const customer = await client(request, admin, 'perfil')
  await asUser(page, customer.token)
  await page.goto('#/perfil')
  await page.locator('#telefono').fill('abc')
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click()
  await expect(page.locator('#telefono-error')).toContainText('dígitos')
  await page.locator('#telefono').fill('2262559999')
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('se actualizó')
  await page.reload()
  await expect(page.locator('#telefono')).toHaveValue('2262559999')
  const context = await browser.newContext({ baseURL })
  const adminPage = await context.newPage()
  await asUser(adminPage, admin.token)
  try {
    await adminPage.goto('#/configuracion')
    await adminPage.locator('#cancelacionHoras').fill('6')
    await adminPage
      .locator('#reembolsos')
      .fill('Los reembolsos se coordinan con administración según cada caso.')
    await adminPage.getByRole('button', { name: 'Guardar política', exact: true }).click()
    await expect(adminPage.getByRole('status')).toContainText('se actualizó')
    await adminPage.reload()
    await expect(adminPage.locator('#cancelacionHoras')).toHaveValue('6')
    await adminPage.locator('#cancelacionHoras').fill('2')
    await adminPage.getByRole('button', { name: 'Guardar política', exact: true }).click()
    await accessible(adminPage)
  } finally {
    await request.put('/api/gestion/configuracion', {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: {
        cancelacionHoras: 2,
        reembolsos: 'Los reembolsos se coordinan con administración según cada caso.',
      },
    })
    await context.close()
  }
})

test('evento publicado, solicitud de entrada, cupo, acreditación y cancelación desde las pantallas', async ({
  page,
  request,
  browser,
  baseURL,
}, testInfo) => {
  const admin = await session(request)
  await asUser(page, admin.token)
  const customer = await client(request, admin, 'entradas')
  const name = `Noche ${Date.now()}`,
    fecha = fechaMinima()
  await page.goto('#/gestion/eventos')
  await page.getByRole('button', { name: 'Crear registro', exact: true }).click()
  for (const [key, value] of Object.entries({
    nombre: name,
    fecha,
    horario: '23:30',
    descripcion: 'Una noche de música para la entrega',
    precioEntrada: '10000',
    precioPuerta: '15000',
    capacidadMaxima: '1',
    dj: 'DJ de prueba',
    dressCode: 'Casual',
  }))
    await page.locator(`#edit-${key}`).fill(value)
  await saveEditor(page)
  await page.getByRole('button', { name: `Editar ${name}`, exact: true }).click()
  await page.locator('#edit-estado').selectOption('PUBLICADO')
  await saveEditor(page)
  const context = await browser.newContext({ baseURL })
  const customerPage = await context.newPage()
  await asUser(customerPage, customer.token)
  try {
    await customerPage.goto('#/eventos')
    await customerPage.getByLabel('Mes del calendario').fill(fecha.slice(0, 7))
    await customerPage
      .getByRole('button', { name: `Ver evento ${name} del ${fecha}`, exact: true })
      .click()
    await expect(customerPage.getByRole('dialog')).toContainText('DJ de prueba')
    await customerPage.getByRole('button', { name: 'Solicitar entrada', exact: true }).click()
    await customerPage.getByRole('button', { name: 'Confirmar entrada', exact: true }).click()
    await expect(customerPage.locator('.business-success')).toContainText('pendiente de pago')
    await customerPage.getByRole('link', { name: 'Ver mis entradas', exact: true }).click()
    await expect(customerPage.locator('.business-card')).toContainText('PENDIENTE PAGO')
    await page.goto('#/entradas')
    await page.getByRole('button', { name: /^Acreditar pago/ }).click()
    await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click()
    await expect(page.locator('.business-card').filter({ hasText: name })).toContainText(
      'CONFIRMADA',
    )
    await customerPage.getByRole('button', { name: 'Actualizar entradas', exact: true }).click()
    await expect(customerPage.locator('.business-card')).toContainText('CONFIRMADA')
    await page.goto('#/reportes')
    await expect(
      page.locator('.business-card').filter({ hasText: 'Entradas con pago acreditado' }),
    ).toContainText('10.000,00')
    await customerPage.goto('#/eventos')
    await customerPage.getByLabel('Mes del calendario').fill(fecha.slice(0, 7))
    await expect(customerPage.locator('.business-card').filter({ hasText: name })).toContainText(
      'Entradas agotadas',
    )
    for (const width of [320, 768, 1440]) {
      await customerPage.setViewportSize({ width, height: 900 })
      expect(
        await customerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true)
      await customerPage.screenshot({
        path: testInfo.outputPath(`eventos-${width}.png`),
        fullPage: true,
      })
    }
    await accessible(customerPage)
    await page.goto('#/gestion/eventos')
    await page.getByRole('button', { name: `Editar ${name}`, exact: true }).click()
    await page.locator('#edit-estado').selectOption('CANCELADO')
    await saveEditor(page)
    await customerPage.goto('#/entradas')
    await expect(customerPage.locator('.business-card')).toContainText('CANCELADA')
    await customerPage.goto('#/historial')
    await expect(customerPage.locator('main')).toContainText(name)
  } finally {
    await context.close()
  }
})
