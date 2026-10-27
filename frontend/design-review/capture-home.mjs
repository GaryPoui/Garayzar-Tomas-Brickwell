import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ locale: 'es-AR', reducedMotion: 'reduce' })
  const base = process.env.SITE_URL || 'http://127.0.0.1:5177/Garayzar-Tomas-Brickwell/'
  for (const [size, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `design-review/home-${size}.png` })
    await page
      .locator('.menu-book')
      .evaluate((element) =>
        window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 115),
      )
    await page.screenshot({ path: `design-review/carta-${size}.png`, fullPage: false })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `design-review/home-full-${size}.png`, fullPage: true })
  }
} finally {
  await browser.close()
}
