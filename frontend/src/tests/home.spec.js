import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function wordmarkPixels(page) {
  const screenshot = await page.locator('.hero-wordmark canvas').screenshot({
    style: '.night-header { visibility: hidden !important; }',
  })
  return page.evaluate(
    async (bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
      )
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      context.drawImage(bitmap, 0, 0)
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
      let colored = 0
      let occupied = 0
      let headerPixels = 0
      let firstRow = canvas.height
      let lastRow = 0
      let firstColumn = canvas.width
      let lastColumn = 0
      for (let offset = 0; offset < data.length; offset += 4) {
        const red = data[offset]
        const green = data[offset + 1]
        const blue = data[offset + 2]
        if (Math.max(red, green, blue) > 40) {
          occupied++
          const pixel = offset / 4
          const row = Math.floor(pixel / canvas.width)
          const column = pixel % canvas.width
          firstRow = Math.min(firstRow, row)
          lastRow = Math.max(lastRow, row)
          firstColumn = Math.min(firstColumn, column)
          lastColumn = Math.max(lastColumn, column)
          if (row < 82) headerPixels++
          if (Math.max(red, green, blue) - Math.min(red, green, blue) > 25) colored++
        }
      }
      bitmap.close()
      return {
        occupied,
        colored,
        headerPixels,
        heightCoverage: (lastRow - firstRow + 1) / canvas.height,
        leftMargin: firstColumn / canvas.width,
        rightMargin: (canvas.width - lastColumn - 1) / canvas.width,
        total: canvas.width * canvas.height,
      }
    },
    [...screenshot],
  )
}

test('título 3D inmersivo con header transparente, mouse y encuadre responsive', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./')
  await expect(page.locator('.hero-wordmark')).toHaveClass(/is-ready/)
  const canvas = page.locator('.hero-wordmark canvas')
  await expect(page.locator('.night-header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.night-header')).toHaveCSS('border-bottom-width', '0px')
  await expect(page.locator('.night-header')).toHaveCSS('backdrop-filter', 'none')
  const bounds = await canvas.boundingBox()
  expect(bounds.y).toBe(0)
  await page.mouse.move(bounds.x + bounds.width * 0.15, bounds.y + bounds.height * 0.3)
  const left = await canvas.screenshot()
  await page.mouse.move(bounds.x + bounds.width * 0.85, bounds.y + bounds.height * 0.7)
  await expect.poll(async () => (await canvas.screenshot()).equals(left)).toBe(false)

  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    const pixels = await wordmarkPixels(page)
    expect(pixels.occupied / pixels.total).toBeGreaterThan(0.05)
    expect(pixels.colored / pixels.total).toBeGreaterThan(0.01)
    expect(pixels.heightCoverage).toBeGreaterThan(0.65)
    expect(pixels.leftMargin).toBeLessThan(0.02)
    expect(pixels.rightMargin).toBeLessThan(0.02)
    expect(pixels.headerPixels).toBeGreaterThan(0)
    const sceneBounds = await canvas.boundingBox()
    expect(sceneBounds.y).toBe(0)
    expect(sceneBounds.height).toBeGreaterThan(800)
    expect(
      await page.locator('.hero-photo').evaluate((element) => element.getBoundingClientRect().top),
    ).toBeLessThan(1000)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(10, 10)
  const stationary = await canvas.screenshot()
  await page.mouse.move(1100, 250)
  expect((await canvas.screenshot()).equals(stationary)).toBe(true)
  expect(errors).toEqual([])
})

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
  await expect(page.locator('.menu-cover strong')).toHaveText('BRICKWELL')
  await expect(page.locator('.menu-flap')).toHaveCSS('transition-duration', '2.8s')
  await page.getByRole('link', { name: 'Tragos', exact: true }).click()
  await expect(page.locator('#tragos')).toBeInViewport()
  await page.locator('.menu-book').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Abrir carta de tragos' })).toBeVisible()
  await expect(page.locator('.menu-book')).not.toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'Abrir carta de tragos' }).click()
  await expect(page.locator('.menu-book')).toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'Mojito Frescos', exact: true }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Mojito')
  await expect(page.locator('.drink-ingredients')).toContainText('Ron blanco')
  await page.getByRole('button', { name: 'Trago siguiente', exact: true }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Negroni')
  await page.getByRole('button', { name: 'Sin alcohol', exact: true }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(2)
  await expect(page.locator('#drink-detail h3')).toHaveText('Citrus & menta')
  await page.getByRole('button', { name: 'Trago siguiente' }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Pomelo & romero')
  await page.getByRole('button', { name: 'Combos', exact: true }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(4)
  await expect(page.locator('#drink-detail h3')).toHaveText('Smirnoff + Speed')
  await expect(page.locator('.drink-price')).toContainText('38.000,00')
  await expect(page.locator('.drink-price')).toContainText('Precio de ejemplo')
  await expect(page.locator('.drink-ingredients')).toContainText('4 Speed de 250 ml')
  await page.getByRole('button', { name: 'Trago anterior' }).click()
  await expect(page.locator('#drink-detail h3')).toHaveText('Gin + tónicas')
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(2)
  await expect(page.locator('.menu-page-navigation')).toContainText('Página 4 de 4')
  await expect(page.getByRole('button', { name: 'Página siguiente de la carta' })).toBeDisabled()
  await page.getByRole('button', { name: 'Página anterior de la carta' }).click()
  await expect(page.locator('.drink-list > button')).toHaveCount(4)
  await expect(page.locator('.menu-page-navigation')).toContainText('Página 3 de 4')
  await page.getByRole('button', { name: 'Página siguiente de la carta' }).click()
  await expect(page.locator('.menu-page-navigation')).toContainText('Página 4 de 4')
  await page.getByRole('button', { name: 'Cerrar carta' }).click()
  await expect(page.locator('.menu-book')).not.toHaveClass(/is-open/)
  await expect(page.getByRole('button', { name: 'Abrir carta de tragos' })).toBeFocused()
  await expect(page.locator('#cocktail-pages')).toHaveAttribute('inert', '')
  await page.keyboard.press('Enter')
  await expect(page.locator('.menu-book')).toHaveClass(/is-open/)
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

test('tapa con bisagra, foto a la izquierda y cierre reversible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('./')
  const book = page.locator('.menu-book')
  const flap = page.locator('.menu-flap')
  const cover = page.getByRole('button', { name: 'Abrir carta de tragos' })
  const close = page.getByRole('button', { name: 'Cerrar carta' })
  await book.scrollIntoViewIfNeeded()
  const closedBounds = await book.boundingBox()
  const photoBounds = await page.locator('.menu-scene').boundingBox()
  const coverBounds = await cover.boundingBox()
  expect(Math.abs(photoBounds.x + photoBounds.width - coverBounds.x)).toBeLessThan(1)
  await cover.click()
  await expect(flap).toHaveCSS(
    'transform',
    'matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)',
  )
  await expect(page.locator('.menu-index')).toHaveCSS('opacity', '1')
  expect(Math.abs((await book.boundingBox()).height - closedBounds.height)).toBeLessThan(1)
  expect(
    await page.locator('.menu-index').evaluate((index) => {
      const bounds = index.getBoundingClientRect()
      return index.contains(document.elementFromPoint(bounds.x + 20, bounds.y + 100))
    }),
  ).toBe(true)
  await close.click()
  await expect(flap).toHaveCSS('transform', 'none')
  await expect(cover).toBeFocused()
  await expect(page.locator('.menu-index')).toBeHidden()
  await expect(close).toBeHidden()
  await cover.click()
  await close.click()
  await expect(flap).toHaveCSS('transform', 'none')
  await expect(cover).toBeFocused()
  await expect(book).not.toHaveClass(/is-open/)
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
  await expect(page.locator('.menu-book')).not.toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'Abrir carta de tragos' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.menu-book')).toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'Página siguiente de la carta' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.menu-page-navigation')).toContainText('Página 2 de 4')
  await page.getByRole('button', { name: 'Página anterior de la carta' }).click()
  await expect(page.getByRole('button', { name: 'Página anterior de la carta' })).toBeDisabled()
  await page.getByRole('button', { name: 'Frescos', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.drink-list > button')).toHaveCount(3)
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
