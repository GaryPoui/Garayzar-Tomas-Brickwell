import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests',
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5175/Garayzar-Tomas-Brickwell/',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'PORT=3101 npm --prefix ../backend start',
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
    },
    {
      command:
        'API_PROXY_TARGET=http://127.0.0.1:3101 npm run dev -- --host 127.0.0.1 --port 5175 --strictPort',
      url: 'http://127.0.0.1:5175/Garayzar-Tomas-Brickwell/',
      reuseExistingServer: false,
    },
  ],
})
