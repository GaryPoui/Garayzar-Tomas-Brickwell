import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('portada independiente, navegación por secciones y carta interactiva', async ({ page }) => {
  const errors = []
  const apiCalls = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/api/reservas')) apiCalls.push(request.url())
  })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'BRICKWEEL', exact: true })).toBeVisible()
  await expect(page.locator('.menu-book')).not.toHaveClass(/is-open/)
  await page.getByRole('link', { name: 'Tragos', exact: true }).click()
  await expect(page.locator('.menu-book')).toHaveClass(/is-open/)
  await expect(page.locator('#tragos')).toBeInViewport()
  await page.getByRole('button', { name: 'Mojito Frescos', exact: true }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Mojito')
  await expect(page.locator('.drink-ingredients')).toContainText('Ron blanco')
  await page.getByRole('button', { name: 'Trago siguiente', exact: true }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Negroni')
  await page.getByRole('button', { name: 'Sin alcohol', exact: true }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(1)
  await expect(page.locator('#drink-detail h3')).toHaveText('Citrus & menta')
  await expect(page.getByRole('button', { name: 'Trago siguiente' })).toBeDisabled()
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(5)
  await page.getByRole('link', { name: 'Reservas', exact: true }).click()
  await expect(page.locator('#reservar')).toBeInViewport()
  expect(apiCalls).toEqual([])
  await page.getByRole('link', { name: 'Reservar una mesa' }).click()
  await expect(page.getByRole('heading', { name: 'Nueva reserva', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'BRICKWEEL, volver al inicio' }).click()
  await expect(page.getByRole('heading', { name: 'BRICKWEEL', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'BRICKWEEL, inicio', exact: true }).click()
  await page.getByRole('link', { name: 'Volver al inicio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'BRICKWEEL', exact: true })).toBeInViewport()
  expect(errors).toEqual([])
})

test('menú móvil, teclado, fotos, movimiento reducido y accesibilidad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  const toggle = page.getByRole('button', { name: 'Abrir menú' })
  await toggle.click()
  await expect(page.getByRole('link', { name: 'Tragos', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await page.getByRole('link', { name: 'Tragos', exact: true }).click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#tragos')).toBeFocused()
  await expect(page.locator('.menu-book')).toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'Frescos', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.drink-list > button')).toHaveCount(2)
  await expect(page.locator('#drink-detail h3')).toHaveText('Mojito')
  await page.getByRole('button', { name: 'Caipirinha Frescos' }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Caipirinha')

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        elements: nodes.map((node) => node.target),
      })),
    ).toEqual([])
  }
  for (const img of await page.locator('.night-site img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect(img).toHaveJSProperty('complete', true)
    expect(await img.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0)
  }
})
