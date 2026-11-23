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
      command: 'npm --prefix ../backend start',
      env: {
        NODE_ENV: 'test',
        PORT: '3101',
        DATABASE_PATH: ':memory:',
        DATABASE_URL: '',
        ADMIN_EMAIL: 'admin-e2e@example.com',
        ADMIN_PASSWORD: 'Admin-e2e-testing-123',
        RECEPCION_EMAIL: 'recepcion-e2e@example.com',
        RECEPCION_PASSWORD: 'Recepcion-e2e-testing-123',
      },
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort',
      env: { API_PROXY_TARGET: 'http://127.0.0.1:3101' },
      url: 'http://127.0.0.1:5175/Garayzar-Tomas-Brickwell/',
      reuseExistingServer: false,
    },
  ],
})
