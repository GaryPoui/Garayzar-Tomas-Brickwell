import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('registro, reserva propia, recarga, cierre y login con privacidad', async ({
  page,
}, testInfo) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const email = `auth-${testInfo.testId}-${testInfo.retry}@example.com`
  const password = 'Una-clave-segura-123'
  await page.goto('#/reservas/nueva?sector=1')
  await expect(page).toHaveURL(/#\/login$/)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#email')).toBeFocused()
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2)
  await page.getByRole('link', { name: 'Crear cuenta', exact: true }).click()
  await page.locator('#nombre').fill('Tomás de prueba')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
  await expect(page.locator('#password')).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(
      await page.locator('.auth-backdrop').evaluate((image) => image.naturalWidth),
    ).toBeGreaterThan(0)
    await page.screenshot({ path: testInfo.outputPath(`registro-${width}.png`), fullPage: true })
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(accessibility.violations).toEqual([])
  }
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await expect(page).toHaveURL(/#\/reservar\?sector=1$/)
  const token = await page.evaluate(() => sessionStorage.getItem('brickwell-session'))
  await expect(page.locator('#cliente')).toHaveCount(0)
  await expect(page.locator('.summary-references')).toContainText('Tomás de prueba')
  await page.getByRole('button', { name: /^Mesa V4,/ }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  const { data: reservations } = await (
    await page.request.get('/api/reservas', { headers: { Authorization: `Bearer ${token}` } })
  ).json()
  await page.reload()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login$/)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill('clave incorrecta')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email o contraseña incorrectos')
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await page.getByRole('link', { name: 'Crear cuenta', exact: true }).click()
  await page.locator('#nombre').fill('Otra persona')
  await page.locator('#email').fill(`otra-${email}`)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await expect(page.getByText('Todavía no hay reservas registradas.')).toBeVisible()
  await expect(page.locator('.reservation-row')).toHaveCount(0)
  const cleanup = await page.request.delete(`/api/reservas/${reservations[0].id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(cleanup.status()).toBe(401)
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'admin-e2e@example.com', password: 'Admin-e2e-testing-123' },
  })
  const { data: cleanupSession } = await login.json()
  expect(
    (
      await page.request.delete(`/api/reservas/${reservations[0].id}`, {
        headers: { Authorization: `Bearer ${cleanupSession.token}` },
      })
    ).ok(),
  ).toBe(true)
  await page.request.post('/api/auth/logout', {
    headers: { Authorization: `Bearer ${cleanupSession.token}` },
  })
  expect(errors).toEqual([])
})

test('sesión inválida vuelve al acceso sin mostrar reservas', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('brickwell-session', '0'.repeat(64)))
  await page.goto('#/reservas')
  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('brickwell-session'))).toBeNull()
})

test('cliente con agenda y reservar; administrador valida, edita y elimina reservas ajenas', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const email = `roles-${testInfo.testId}-${testInfo.retry}@example.com`
  const password = 'Cliente-testing-password-123'
  await page.goto('#/registro')
  await page.locator('#nombre').fill('Cliente roles')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await expect(page).toHaveURL(/#\/agenda$/)
  await expect(page.locator('.management-navigation a')).toHaveText(['Agenda', 'Reservar'])
  await expect(page.locator('.summary')).toHaveCount(0)
  await page
    .locator('.management-navigation')
    .getByRole('link', { name: 'Reservar', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Reservar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Mesa V1,/ }).click()
  await page.getByRole('button', { name: 'Crear reserva', exact: true }).click()
  await expect(page.locator('.reservation-row')).toHaveCount(1)
  const token = await page.evaluate(() => sessionStorage.getItem('brickwell-session'))
  const clientHeaders = { Authorization: `Bearer ${token}` }
  const { data: reservations } = await (
    await page.request.get('/api/reservas', { headers: clientHeaders })
  ).json()
  const reservation = reservations[0]
  await expect(
    page.getByRole('link', { name: `Editar reserva #${reservation.id}`, exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: `Eliminar reserva #${reservation.id}`, exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: `Ver reserva #${reservation.id}`, exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Editar reserva' })).toHaveCount(
    0,
  )
  await page.keyboard.press('Escape')
  await page.goto(`#/reservas/${reservation.id}/editar`)
  await expect(page).toHaveURL(/#\/agenda$/)
  await page.goto('#/reservas')
  await expect(page).toHaveURL(/#\/agenda$/)
  expect(
    (
      await page.request.put(`/api/reservas/${reservation.id}`, {
        headers: clientHeaders,
        data: { estado: 'CONFIRMADA' },
      })
    ).status(),
  ).toBe(403)
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`cliente-${width}.png`), fullPage: true })
  }
  const adminContext = await browser.newContext({ baseURL })
  const admin = await adminContext.newPage()
  try {
    await admin.goto('#/login')
    await admin.locator('#email').fill('admin-e2e@example.com')
    await admin.locator('#password').fill('Admin-e2e-testing-123')
    await admin.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(admin).toHaveURL(/#\/reservas$/)
    await expect(admin.locator('.management-navigation a')).toHaveText([
      'Reservas',
      'Agenda',
      'Nueva reserva',
    ])
    await expect(admin.locator('.reservation-row')).toContainText(`Cliente #${reservation.cliente}`)
    for (const width of [320, 768, 1280, 1440]) {
      await admin.setViewportSize({ width, height: 900 })
      expect(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const actions = await admin.locator('.row-actions').boundingBox()
      const status = await admin.locator('.row-status').boundingBox()
      const amount = await admin.locator('.reservation-row .row-cell').nth(2).boundingBox()
      for (const neighbor of [status, amount])
        expect(
          actions.x >= neighbor.x + neighbor.width ||
            actions.y >= neighbor.y + neighbor.height ||
            actions.x + actions.width <= neighbor.x ||
            actions.y + actions.height <= neighbor.y,
        ).toBe(true)
      await admin.screenshot({ path: testInfo.outputPath(`admin-${width}.png`), fullPage: true })
      const accessibility = await new AxeBuilder({ page: admin })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(accessibility.violations).toEqual([])
    }
    await admin
      .getByRole('button', { name: `Validar reserva #${reservation.id}`, exact: true })
      .click()
    await admin.getByRole('button', { name: 'Confirmar reserva', exact: true }).click()
    await expect(admin.locator('.reservation-row')).toContainText('Confirmada')
    await page.reload()
    await expect(page.locator('.reservation-row')).toContainText('Confirmada')
    await admin
      .getByRole('link', { name: `Editar reserva #${reservation.id}`, exact: true })
      .click()
    await expect(admin.locator('.summary-references')).toContainText(
      `Cliente #${reservation.cliente}`,
    )
    await admin.locator('#horario').fill('22:00')
    await admin.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(admin.locator('.reservation-row')).toContainText('22:00')
    await page.reload()
    await expect(page.locator('.reservation-row')).toContainText('22:00')
    await admin
      .getByRole('button', { name: `Eliminar reserva #${reservation.id}`, exact: true })
      .click()
    await admin.getByRole('button', { name: 'Eliminar reserva', exact: true }).click()
    await expect(admin.locator('.reservation-row')).toHaveCount(0)
    await page.reload()
    await expect(page.locator('.reservation-row')).toHaveCount(0)
  } finally {
    await adminContext.close()
  }
})
