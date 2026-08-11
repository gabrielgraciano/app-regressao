import { defineConfig, devices } from '@playwright/test'

/**
 * Testes de navegador. Existem porque a matemática já tem rede de proteção em
 * `src/lib`, mas o que se vê na tela não tinha nenhuma: o eixo y que deslizava
 * junto com os dados passou por dezenas de testes unitários verdes.
 *
 * Roda contra o build de produção servido pelo `preview`, no mesmo caminho do
 * GitHub Pages — assim um erro de `base` também é pego aqui.
 */
const PORTA = 4173
const BASE = `http://127.0.0.1:${PORTA}/app-regressao/`

/**
 * Alguns ambientes já trazem um Chromium instalado cuja versão não é a que
 * este pacote do Playwright baixaria. Quando `CHROMIUM_BIN` aponta para esse
 * binário, usa-se ele; no CI o navegador é instalado pelo próprio Playwright.
 */
const executablePath = process.env.CHROMIUM_BIN || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  outputDir: './e2e/.saida',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
    {
      name: 'celular',
      use: { ...devices['Pixel 7'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    // `--host 127.0.0.1` é necessário: sem ele o preview escuta em `localhost`,
    // que em runners de CI resolve para ::1, e a espera em 127.0.0.1 nunca
    // encontra o servidor — o teste falha por timeout sem nenhuma pista.
    command: `npm run preview -- --port ${PORTA} --strictPort --host 127.0.0.1`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
